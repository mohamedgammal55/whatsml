<div id="loader-container"
    style="position:fixed;inset:0;z-index:9999999;display:flex;flex-direction:column;align-items:center;justify-content:center;
           background:radial-gradient(80% 60% at 50% 40%, #0c2c1c 0%, #06140d 70%);">

    <div style="position:relative;display:flex;align-items:center;justify-content:center;margin-bottom:26px;">
        <span class="qz-loader-ring"></span>
        <img src="/assets/quickzap/mark.png?v=3" alt="QuickZap"
            style="position:relative;z-index:2;width:74px;height:74px;border-radius:18px;
                   box-shadow:0 18px 40px -12px rgba(46,229,133,.6);" />
    </div>

    <p style="font-family:'Bricolage Grotesque','Sora',sans-serif;font-weight:800;letter-spacing:-.02em;
              font-size:22px;color:#fff;margin:0 0 22px;">
        Quick<span style="color:#34d399;">Zap</span>
    </p>

    <div style="width:200px;max-width:60vw;">
        <div style="background:rgba(255,255,255,.08);padding:2px;border-radius:999px;">
            <div id="loader" style="background:linear-gradient(90deg,#10b981,#34d399);border-radius:999px;height:6px;width:0;
                                    box-shadow:0 0 14px rgba(46,229,133,.8);transition:width .25s ease;"></div>
        </div>
        <p id="loader-text" style="text-align:center;font-size:12px;color:#9fb4ab;margin-top:8px;font-family:'Plus Jakarta Sans',sans-serif;">0%</p>
    </div>
</div>

<style>
    .qz-loader-ring {
        position: absolute;
        width: 110px;
        height: 110px;
        border-radius: 24px;
        border: 2px solid rgba(46, 229, 133, .35);
        animation: qz-pulse 1.6s ease-out infinite;
    }
    @keyframes qz-pulse {
        0% { transform: scale(.85); opacity: .9; }
        100% { transform: scale(1.3); opacity: 0; }
    }
</style>
