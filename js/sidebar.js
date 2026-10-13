// Shared sidebar behaviour for every page that uses the left sidebar.
// Same logic as the inline script in index.html: collapse/expand (remembered), mobile drawer, overlay, Escape.
(function () {
    function init() {
        var sidebar = document.getElementById('sidebar');
        if (!sidebar) return;
        var layout = document.querySelector('.landing-layout');
        var collapseBtn = document.getElementById('sidebarCollapseBtn');
        var mobileMenuBtn = document.getElementById('mobileMenuBtn');
        var overlay = document.getElementById('sidebarOverlay');
        var menuLinks = document.querySelectorAll('.sidebar-menu .menu-link');
        var KEY = 'sv_sidebar_collapsed';

        function setCollapsed(on) {
            sidebar.classList.toggle('collapsed', on);
            if (layout) layout.classList.toggle('collapsed', on);
        }
        if (localStorage.getItem(KEY) === 'true' && window.innerWidth > 900) setCollapsed(true);

        if (collapseBtn) collapseBtn.addEventListener('click', function () {
            var now = !sidebar.classList.contains('collapsed');
            setCollapsed(now);
            localStorage.setItem(KEY, now ? 'true' : 'false');
        });

        function openDrawer() {
            sidebar.classList.add('open');
            if (overlay) overlay.classList.add('active');
            if (mobileMenuBtn) mobileMenuBtn.setAttribute('aria-expanded', 'true');
            document.body.classList.add('sidebar-open');
        }
        function closeDrawer() {
            sidebar.classList.remove('open');
            if (overlay) overlay.classList.remove('active');
            if (mobileMenuBtn) mobileMenuBtn.setAttribute('aria-expanded', 'false');
            document.body.classList.remove('sidebar-open');
        }
        if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            if (sidebar.classList.contains('open')) closeDrawer(); else openDrawer();
        });
        if (overlay) overlay.addEventListener('click', closeDrawer);
        menuLinks.forEach(function (l) {
            l.addEventListener('click', function () { if (window.innerWidth <= 900) closeDrawer(); });
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && sidebar.classList.contains('open')) closeDrawer();
        });
        window.addEventListener('resize', function () {
            if (window.innerWidth > 900) {
                closeDrawer();
                setCollapsed(localStorage.getItem(KEY) === 'true');
            } else {
                setCollapsed(false);
            }
        });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();