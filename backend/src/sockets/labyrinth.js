const games = new Map();

const formatCoord = (r, c) => `${String.fromCharCode(65 + c)}${r + 1}`;
const formatPos = (pos) => {
    if (!pos) return 'Unknown';
    const [r, c] = pos.split('-').map(Number);
    return formatCoord(r, c);
};

export const initLabyrinthSocket = (io) => {
    // Using a namespace for labyrinth to isolate it from global chat/other functions
    const labyrinthNamespace = io.of('/labyrinth');

    labyrinthNamespace.on('connection', (socket) => {
        console.log('Labyrinth socket connected:', socket.id);

        socket.on('create_game', ({ name, password, board, start, end, username }) => {
            const trimmedName = name ? name.trim() : '';
            if (games.has(trimmedName)) {
                socket.emit('error', 'Game name already exists');
                return;
            }
            games.set(trimmedName, {
                password: password ? password.trim() : '',
                host: { id: socket.id, username, board, start, end, currentPos: start },
                joiner: null,
                turn: username, // Host starts first (by username)
                status: 'waiting',
                spectators: new Set(),
                log: [{ text: `System initialized. Game "${name}" created. Waiting for opponent...`, type: 'system', time: new Date().toLocaleTimeString() }]
            });
            socket.join(trimmedName);
            console.log(`Labyrinth Game created: ${trimmedName} by ${username}`);
            socket.emit('game_created', { name: trimmedName });
        });

        socket.on('join_game', ({ name, password, board, start, end, username }) => {
            const trimmedName = name ? name.trim() : '';
            const trimmedPassword = password ? password.trim() : '';
            const game = games.get(trimmedName);
            if (!game) {
                console.log(`Join attempt failed: Game "${trimmedName}" not found. Available:`, Array.from(games.keys()));
                socket.emit('error', 'Game not found');
                return;
            }
            if (game.password !== trimmedPassword) {
                console.log(`Join attempt failed: Incorrect password for "${trimmedName}".`);
                socket.emit('error', 'Incorrect password');
                return;
            }
            if (game.joiner) {
                socket.emit('error', 'Game is full');
                return;
            }

            game.joiner = { id: socket.id, username, board, start, end, currentPos: game.host.start };
            game.host.currentPos = start;
            game.status = 'playing';

            socket.join(trimmedName);
            console.log(`User ${username} joined labyrinth game ${trimmedName}`);

            const startMsg = { text: `Match initiated: ${game.host.username} vs ${game.joiner.username}`, type: 'system', time: new Date().toLocaleTimeString() };
            game.log.push(startMsg);

            // Notify everyone in this room (within the namespace)
            labyrinthNamespace.to(trimmedName).emit('game_started', {
                host: game.host.username,
                joiner: game.joiner.username,
                hostPos: game.host.currentPos,
                joinerPos: game.joiner.currentPos,
                hostTarget: game.joiner.end,
                joinerTarget: game.host.end,
                turn: game.turn,
                log: startMsg.text,
                name: trimmedName,
                password: game.password
            });

            // Send initial opponent data (masked)
            labyrinthNamespace.to(game.host.id).emit('opponent_data', { start: game.joiner.start, end: game.joiner.end });
            labyrinthNamespace.to(game.joiner.id).emit('opponent_data', { start: game.host.start, end: game.host.end });
        });

        socket.on('reconnect_game', ({ name, password, username }) => {
            const trimmedName = name ? name.trim() : '';
            const trimmedPassword = password ? password.trim() : '';
            const game = games.get(trimmedName);
            if (!game || game.password !== trimmedPassword) {
                console.log(`Reconnect failed: Game "${trimmedName}" not found or credentials invalid. User: ${username}`);
                socket.emit('error', 'Game not found or invalid credentials');
                return;
            }

            let isHost = game.host.username === username;
            let isJoiner = game.joiner && game.joiner.username === username;

            if (!isHost && !isJoiner) {
                socket.emit('error', 'Access denied: not a player in this game');
                return;
            }

            socket.join(trimmedName);
            if (isHost) game.host.id = socket.id;
            else if (isJoiner) game.joiner.id = socket.id;

            socket.emit('reconnected', {
                status: game.status,
                turn: game.turn,
                myPosition: isHost ? game.host.currentPos : game.joiner.currentPos,
                opponentPosition: isHost ? (game.joiner ? game.joiner.currentPos : null) : game.host.currentPos,
                opponentData: isHost ? (game.joiner ? { start: game.joiner.start, end: game.joiner.end } : null) : { start: game.host.start, end: game.host.end },
                log: game.log,
                hostName: game.host.username,
                joinerName: game.joiner ? game.joiner.username : null,
                startCell: isHost ? game.host.start : (game.joiner ? game.joiner.start : null),
                endCell: isHost ? game.host.end : (game.joiner ? game.joiner.end : null),
                walls: Array.from(isHost ? game.host.board : (game.joiner ? game.joiner.board : []))
            });

            labyrinthNamespace.to(trimmedName).emit('player_reconnected', { username });
        });

        socket.on('spectate_game', ({ name }) => {
            const trimmedName = name ? name.trim() : '';
            const game = games.get(trimmedName);
            if (!game) {
                socket.emit('error', 'Game not found');
                return;
            }
            socket.join(trimmedName);
            game.spectators.add(socket.id);

            socket.emit('spectating_started', {
                hostName: game.host.username,
                joinerName: game.joiner ? game.joiner.username : null,
                hostPos: game.host.currentPos,
                joinerPos: game.joiner ? game.joiner.currentPos : null,
                hostTarget: game.joiner ? game.joiner.end : null,
                joinerTarget: game.host.end,
                status: game.status,
                turn: game.turn,
                log: game.log
            });
        });

        socket.on('make_move', ({ gameName, targetCell }) => {
            const trimmedName = gameName ? gameName.trim() : '';
            const game = games.get(trimmedName);
            if (!game || game.status !== 'playing') return;

            const isHost = socket.id === game.host.id;
            const isJoiner = game.joiner && socket.id === game.joiner.id;
            const player = isHost ? game.host : (isJoiner ? game.joiner : null);

            if (!player) {
                socket.emit('error', 'Not a player in this game');
                return;
            }

            if (game.turn !== player.username) {
                socket.emit('error', 'Not your turn');
                return;
            }

            const opponent = isHost ? game.joiner : game.host;
            const fromPos = player.currentPos;
            const [currR, currC] = fromPos.split('-').map(Number);
            const [targetR, targetC] = targetCell.split('-').map(Number);

            const moveStr = `${formatCoord(currR, currC)}-${formatCoord(targetR, targetC)}`;
            const dist = Math.abs(currR - targetR) + Math.abs(currC - targetC);

            if (dist !== 1) {
                socket.emit('move_result', { success: false, message: 'Invalid move: must be adjacent' });
                game.turn = opponent.username;
                labyrinthNamespace.to(trimmedName).emit('turn_update', { turn: game.turn });
                return;
            }

            let wallKey = null;
            if (currR === targetR) {
                if (targetC > currC) wallKey = `v-${currR}-${targetC}`;
                else wallKey = `v-${currR}-${currC}`;
            } else {
                if (targetR > currR) wallKey = `h-${targetR}-${currC}`;
                else wallKey = `h-${currR}-${currC}`;
            }

            if (opponent.board.includes(wallKey)) {
                const hitMsg = { text: `${player.username} hit a wall at ${moveStr}`, type: 'warning', time: new Date().toLocaleTimeString() };
                game.log.push(hitMsg);
                socket.emit('move_result', { success: false, message: `You hit a wall at ${moveStr}!` });
                game.turn = opponent.username;
                labyrinthNamespace.to(trimmedName).emit('turn_update', {
                    turn: game.turn,
                    log: hitMsg.text
                });
            } else {
                player.currentPos = targetCell;
                if (player.currentPos === opponent.end) {
                    const winMsg = `${player.username} reached the destination! GAME OVER.`;
                    game.log.push({ text: winMsg, type: 'system', time: new Date().toLocaleTimeString() });
                    labyrinthNamespace.to(trimmedName).emit('game_over', {
                        winner: player.username,
                        hostBoard: game.host.board,
                        joinerBoard: game.joiner.board,
                        log: winMsg
                    });
                    games.delete(trimmedName);
                } else {
                    const moveMsg = `${player.username} moved to ${formatCoord(targetR, targetC)}`;
                    game.log.push({ text: moveMsg, type: 'info', time: new Date().toLocaleTimeString() });
                    socket.emit('move_result', { success: true, position: targetCell });
                    labyrinthNamespace.to(trimmedName).emit('game_update', {
                        player: player.username,
                        from: fromPos,
                        to: targetCell,
                        moveStr: moveStr,
                        turn: game.turn
                    });
                }
            }
        });

        socket.on('disconnect', () => {
            console.log('Labyrinth client disconnected:', socket.id);
        });
    });
};
