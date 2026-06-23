// App Logic
document.addEventListener('DOMContentLoaded', () => {
    // 1. Service Worker Registration for PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('Service Worker Registrado', reg))
            .catch(err => console.log('Erro no Service Worker', err));
    }

    // 2. Navigation Logic (SPA)
    const contentArea = document.getElementById('app-content');
    const navButtons = document.querySelectorAll('.nav-btn');

    function navigateTo(targetId) {
        // Update nav active state
        navButtons.forEach(btn => {
            if (btn.dataset.target === targetId) {
                btn.classList.add('active');
                btn.classList.remove('text-on-surface-variant', 'hover:text-on-surface', 'hover:bg-surface-bright/10');
            } else {
                btn.classList.remove('active');
                btn.classList.add('text-on-surface-variant', 'hover:text-on-surface', 'hover:bg-surface-bright/10');
            }
        });

        // Load Template
        const template = document.getElementById(`tpl-${targetId}`);
        if (template) {
            contentArea.innerHTML = '';
            contentArea.appendChild(template.content.cloneNode(true));
            
            // Re-initialize specific views if needed
            if (targetId === 'palpites') {
                renderMatches();
            }
        }
    }

    // Attach click listeners
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            navigateTo(btn.dataset.target);
        });
    });

    // Make navigateTo globally accessible for inline onclicks (like the "Ver todos" button)
    window.navigateTo = navigateTo;

    // Load initial route
    navigateTo('home');

    // 3. Mock Matches Data for "Palpites"
    const matches = [
        { id: 1, date: 'Sáb, 16:00', stadium: 'MetLife Stadium', home: 'Brasil', homeFlag: '🇧🇷', away: 'França', awayFlag: '🇫🇷' },
        { id: 2, date: 'Dom, 13:00', stadium: 'AT&T Stadium', home: 'Argentina', homeFlag: '🇦🇷', away: 'Portugal', awayFlag: '🇵🇹', hScore: 2, aScore: 1 },
        { id: 3, date: 'Sáb, 21:00', stadium: 'SoFi Stadium', home: 'Alemanha', homeFlag: '🇩🇪', away: 'Japão', awayFlag: '🇯🇵' },
        { id: 4, date: 'Dom, 16:00', stadium: 'Mercedes-Benz Arena', home: 'Inglaterra', homeFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', away: 'Espanha', awayFlag: '🇪🇸' },
    ];

    function renderMatches() {
        const container = document.getElementById('matches-container');
        if (!container) return;

        container.innerHTML = matches.map(m => `
            <div class="match-card p-5 rounded-xl border border-white/5 bg-surface-container-low transition-all focus-within:border-secondary focus-within:shadow-[0_0_15px_rgba(215,255,197,0.1)]">
                <div class="flex items-center justify-between mb-4">
                    <span class="text-[10px] font-label-sm px-2 py-0.5 bg-surface-variant text-on-surface-variant rounded uppercase tracking-wider">${m.date} • ${m.stadium}</span>
                    <span class="material-symbols-outlined text-on-surface-variant text-lg">info</span>
                </div>
                <div class="flex items-center justify-between gap-4">
                    <div class="flex flex-col items-center flex-1">
                        <div class="w-16 h-16 mb-2 flex items-center justify-center p-2 rounded-full bg-white/5 border border-white/10 text-3xl">
                            ${m.homeFlag}
                        </div>
                        <span class="text-label-sm font-label-sm text-center uppercase tracking-tight">${m.home}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <input type="number" class="w-12 h-14 ${m.hScore !== undefined ? 'bg-primary-container border-secondary-container/30 border text-secondary-container' : 'bg-surface-container-high border-none text-secondary-container'} rounded-lg text-center font-label-md text-2xl focus:ring-2 focus:ring-secondary-container outline-none" placeholder="0" value="${m.hScore !== undefined ? m.hScore : ''}">
                        <span class="font-bold text-outline-variant">x</span>
                        <input type="number" class="w-12 h-14 ${m.aScore !== undefined ? 'bg-primary-container border-secondary-container/30 border text-secondary-container' : 'bg-surface-container-high border-none text-secondary-container'} rounded-lg text-center font-label-md text-2xl focus:ring-2 focus:ring-secondary-container outline-none" placeholder="0" value="${m.aScore !== undefined ? m.aScore : ''}">
                    </div>
                    <div class="flex flex-col items-center flex-1">
                        <div class="w-16 h-16 mb-2 flex items-center justify-center p-2 rounded-full bg-white/5 border border-white/10 text-3xl">
                            ${m.awayFlag}
                        </div>
                        <span class="text-label-sm font-label-sm text-center uppercase tracking-tight">${m.away}</span>
                    </div>
                </div>
            </div>
        `).join('');

        // Add input restrictions
        document.querySelectorAll('input[type="number"]').forEach(input => {
            input.addEventListener('input', function() {
                if(this.value.length > 2) this.value = this.value.slice(0,2);
            });
            input.addEventListener('focus', function() { this.select(); });
        });
    }
});
