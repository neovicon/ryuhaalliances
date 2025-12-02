import { useState } from 'react'
import { Download as DownloadIcon, Smartphone, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import SEO from '../components/SEO'

export default function Download() {
    const [downloading, setDownloading] = useState(false)

    const handleDownload = async () => {
        setDownloading(true)
        try {
            // Fetch the APK file
            const response = await fetch('/assets/Apps/andriod.apk')
            const blob = await response.blob()

            // Create a blob with the correct MIME type
            const apkBlob = new Blob([blob], { type: 'application/vnd.android.package-archive' })

            // Create download link
            const url = window.URL.createObjectURL(apkBlob)
            const link = document.createElement('a')
            link.href = url
            link.download = 'RyuhaAlliance.apk'
            document.body.appendChild(link)
            link.click()

            // Cleanup
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)
        } catch (error) {
            console.error('Download failed:', error)
            alert('Failed to download the APK. Please try again.')
        } finally {
            // Reset downloading state after a delay
            setTimeout(() => setDownloading(false), 2000)
        }
    }

    return (
        <>
            <SEO
                title="Download App - Ryuha Alliance"
                description="Download the Ryuha Alliance mobile app for Android. Stay connected with your alliance on the go."
                keywords="Ryuha Alliance, mobile app, Android app, download"
            />

            <div style={{
                minHeight: 'calc(100vh - 200px)',
                background: 'linear-gradient(135deg, rgba(177, 15, 46, 0.05) 0%, rgba(11, 11, 12, 0.95) 100%)',
                padding: '3rem 1rem'
            }}>
                <div className="container" style={{ maxWidth: '900px' }}>
                    {/* Hero Section */}
                    <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '80px',
                            height: '80px',
                            borderRadius: '20px',
                            background: 'linear-gradient(135deg, var(--primary) 0%, #8b0a23 100%)',
                            marginBottom: '1.5rem',
                            boxShadow: '0 10px 40px rgba(177, 15, 46, 0.3)'
                        }}>
                            <Smartphone size={40} color="white" />
                        </div>

                        <h1 className="hdr" style={{
                            fontSize: '2.5rem',
                            marginBottom: '1rem',
                            background: 'linear-gradient(135deg, var(--text) 0%, var(--primary) 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                        }}>
                            Download Ryuha Alliance
                        </h1>

                        <p style={{
                            color: 'var(--muted)',
                            fontSize: '1.1rem',
                            maxWidth: '600px',
                            margin: '0 auto',
                            lineHeight: '1.6'
                        }}>
                            Stay connected with your alliance on the go. Access all features right from your mobile device.
                        </p>
                    </div>

                    {/* Download Cards */}
                    <div className="grid" style={{
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '1.5rem',
                        marginBottom: '2rem'
                    }}>
                        {/* Android Card */}
                        <div className="card" style={{
                            padding: '2rem',
                            background: 'linear-gradient(135deg, rgba(177, 15, 46, 0.08) 0%, var(--surface) 100%)',
                            border: '1px solid rgba(177, 15, 46, 0.2)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                position: 'absolute',
                                top: '-20px',
                                right: '-20px',
                                width: '100px',
                                height: '100px',
                                background: 'radial-gradient(circle, rgba(177, 15, 46, 0.15) 0%, transparent 70%)',
                                borderRadius: '50%'
                            }} />

                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    marginBottom: '1.5rem'
                                }}>
                                    <div style={{
                                        width: '50px',
                                        height: '50px',
                                        borderRadius: '12px',
                                        background: 'linear-gradient(135deg, #3DDC84 0%, #2BAF68 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 4px 15px rgba(61, 220, 132, 0.3)'
                                    }}>
                                        <i className="fa-brands fa-android" style={{ fontSize: '24px', color: 'white' }}></i>
                                    </div>
                                    <div>
                                        <h3 className="hdr" style={{ margin: 0, fontSize: '1.3rem' }}>Android</h3>
                                        <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>Available Now</p>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <CheckCircle size={16} color="#10b981" />
                                        <span style={{ fontSize: '0.95rem' }}>Latest version</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <CheckCircle size={16} color="#10b981" />
                                        <span style={{ fontSize: '0.95rem' }}>Full feature access</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <CheckCircle size={16} color="#10b981" />
                                        <span style={{ fontSize: '0.95rem' }}>Optimized performance</span>
                                    </div>
                                </div>

                                <button
                                    className="btn"
                                    onClick={handleDownload}
                                    disabled={downloading}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        fontSize: '1rem',
                                        padding: '0.8rem 1.5rem',
                                        opacity: downloading ? 0.7 : 1,
                                        cursor: downloading ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    <DownloadIcon size={18} />
                                    {downloading ? 'Downloading...' : 'Download APK'}
                                </button>
                            </div>
                        </div>

                        {/* iOS Card */}
                        <div className="card" style={{
                            padding: '2rem',
                            background: 'linear-gradient(135deg, rgba(75, 85, 99, 0.08) 0%, var(--surface) 100%)',
                            border: '1px solid rgba(75, 85, 99, 0.2)',
                            position: 'relative',
                            overflow: 'hidden',
                            opacity: 0.7
                        }}>
                            <div style={{
                                position: 'absolute',
                                top: '-20px',
                                right: '-20px',
                                width: '100px',
                                height: '100px',
                                background: 'radial-gradient(circle, rgba(75, 85, 99, 0.15) 0%, transparent 70%)',
                                borderRadius: '50%'
                            }} />

                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    marginBottom: '1.5rem'
                                }}>
                                    <div style={{
                                        width: '50px',
                                        height: '50px',
                                        borderRadius: '12px',
                                        background: 'linear-gradient(135deg, #555555 0%, #333333 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)'
                                    }}>
                                        <i className="fa-brands fa-apple" style={{ fontSize: '28px', color: 'white' }}></i>
                                    </div>
                                    <div>
                                        <h3 className="hdr" style={{ margin: 0, fontSize: '1.3rem' }}>iOS</h3>
                                        <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>Coming Soon</p>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <XCircle size={16} color="#6b7280" />
                                        <span style={{ fontSize: '0.95rem', color: 'var(--muted)' }}>Not available yet</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <AlertCircle size={16} color="#6b7280" />
                                        <span style={{ fontSize: '0.95rem', color: 'var(--muted)' }}>In development</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <AlertCircle size={16} color="#6b7280" />
                                        <span style={{ fontSize: '0.95rem', color: 'var(--muted)' }}>Stay tuned</span>
                                    </div>
                                </div>

                                <button
                                    className="btn"
                                    disabled
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        fontSize: '1rem',
                                        padding: '0.8rem 1.5rem',
                                        opacity: 0.5,
                                        cursor: 'not-allowed',
                                        background: 'var(--accent)'
                                    }}
                                >
                                    <DownloadIcon size={18} />
                                    Not Available
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Installation Instructions */}
                    <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
                        <h2 className="hdr" style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.5rem' }}>
                            Installation Instructions
                        </h2>

                        <div style={{ display: 'grid', gap: '1.5rem' }}>
                            <div>
                                <h4 style={{
                                    color: 'var(--primary)',
                                    marginTop: 0,
                                    marginBottom: '0.75rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}>
                                    <span style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        background: 'var(--primary)',
                                        color: 'white',
                                        fontSize: '0.85rem',
                                        fontWeight: 'bold'
                                    }}>1</span>
                                    Enable Unknown Sources
                                </h4>
                                <p style={{ color: 'var(--muted)', lineHeight: '1.6', margin: 0 }}>
                                    Go to <strong>Settings → Security → Unknown Sources</strong> and enable installation from unknown sources.
                                    This allows you to install apps from outside the Google Play Store.
                                </p>
                            </div>

                            <div>
                                <h4 style={{
                                    color: 'var(--primary)',
                                    marginTop: 0,
                                    marginBottom: '0.75rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}>
                                    <span style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        background: 'var(--primary)',
                                        color: 'white',
                                        fontSize: '0.85rem',
                                        fontWeight: 'bold'
                                    }}>2</span>
                                    Download the APK
                                </h4>
                                <p style={{ color: 'var(--muted)', lineHeight: '1.6', margin: 0 }}>
                                    Click the "Download APK" button above to download the Ryuha Alliance app to your device.
                                </p>
                            </div>

                            <div>
                                <h4 style={{
                                    color: 'var(--primary)',
                                    marginTop: 0,
                                    marginBottom: '0.75rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}>
                                    <span style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        background: 'var(--primary)',
                                        color: 'white',
                                        fontSize: '0.85rem',
                                        fontWeight: 'bold'
                                    }}>3</span>
                                    Install the App
                                </h4>
                                <p style={{ color: 'var(--muted)', lineHeight: '1.6', margin: 0 }}>
                                    Open the downloaded APK file and follow the on-screen instructions to install the app.
                                    Once installed, you can launch it from your app drawer.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Additional Info */}
                    <div style={{
                        padding: '1.5rem',
                        background: 'rgba(177, 15, 46, 0.05)',
                        border: '1px solid rgba(177, 15, 46, 0.2)',
                        borderRadius: '12px',
                        textAlign: 'center'
                    }}>
                        <AlertCircle size={24} color="var(--primary)" style={{ marginBottom: '0.75rem' }} />
                        <p style={{ margin: 0, color: 'var(--muted)', lineHeight: '1.6' }}>
                            <strong style={{ color: 'var(--text)' }}>Note:</strong> The iOS version is currently in development.
                            We'll notify all members once it becomes available. For now, iOS users can access all features through our web platform.
                        </p>
                    </div>
                </div>
            </div>
        </>
    )
}
