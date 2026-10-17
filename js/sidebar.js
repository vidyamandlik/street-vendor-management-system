// Shared sidebar behaviour for every page that uses the left sidebar.
// Handles both standard sidebars (#sidebar) and dashboard sidebars (#dashSidebar).
(function () {
    function init() {
        // -----------------------------------------------------
        // 1. Standard Sidebar (Landing, Auth pages, Vendor Dashboard)
        // -----------------------------------------------------
        var sidebar = document.getElementById('sidebar');
        if (sidebar) {
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

        // -----------------------------------------------------
        // 2. Dashboard Sidebar (Admin & Customer Dashboards)
        // -----------------------------------------------------
        var dashSidebar = document.getElementById('dashSidebar');
        if (dashSidebar) {
            var dashMenuBtn = document.getElementById('dashMenuBtn');
            var dashOverlay = document.getElementById('dashOverlay');
            var dashCollapseBtn = document.getElementById('dashCollapseBtn');
            var dashLinks = dashSidebar.querySelectorAll('.dash-link');
            var DASH_KEY = 'sv_dash_sidebar_collapsed';

            function setDashCollapsed(on) {
                document.body.classList.toggle('collapsed', on);
                if (dashCollapseBtn) {
                    dashCollapseBtn.setAttribute('aria-expanded', on ? 'false' : 'true');
                }
            }
            if (localStorage.getItem(DASH_KEY) === 'true' && window.innerWidth > 900) {
                setDashCollapsed(true);
            }

            if (dashCollapseBtn) {
                dashCollapseBtn.addEventListener('click', function () {
                    var now = !document.body.classList.contains('collapsed');
                    setDashCollapsed(now);
                    localStorage.setItem(DASH_KEY, now ? 'true' : 'false');
                });
            }

            function openDashDrawer() {
                dashSidebar.classList.add('open');
                if (dashOverlay) dashOverlay.classList.add('active');
                if (dashMenuBtn) dashMenuBtn.setAttribute('aria-expanded', 'true');
                document.body.classList.add('drawer-open');
            }
            function closeDashDrawer() {
                dashSidebar.classList.remove('open');
                if (dashOverlay) dashOverlay.classList.remove('active');
                if (dashMenuBtn) dashMenuBtn.setAttribute('aria-expanded', 'false');
                document.body.classList.remove('drawer-open');
            }

            if (dashMenuBtn) {
                dashMenuBtn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    if (dashSidebar.classList.contains('open')) closeDashDrawer(); else openDashDrawer();
                });
            }
            if (dashOverlay) {
                dashOverlay.addEventListener('click', closeDashDrawer);
            }
            dashLinks.forEach(function (l) {
                l.addEventListener('click', function () {
                    if (window.innerWidth <= 900) closeDashDrawer();
                });
            });
            document.addEventListener('keydown', function (e) {
                if (e.key === 'Escape' && dashSidebar.classList.contains('open')) closeDashDrawer();
            });
            window.addEventListener('resize', function () {
                if (window.innerWidth > 900) {
                    closeDashDrawer();
                    setDashCollapsed(localStorage.getItem(DASH_KEY) === 'true');
                } else {
                    document.body.classList.remove('collapsed');
                }
            });
        }
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();