// 🚀 KINGGROUP API CLIENT - Sistema completo de conexão com backend
class KingGroupAPI {
    constructor() {
        this.baseURL = window.location.origin;
        this.token = localStorage.getItem('kinggroup_token');
    }

    // Configurar headers para requisições
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        return headers;
    }

    // Fazer requisição HTTP
    async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                headers: this.getHeaders(),
                ...options
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Erro na requisição');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // === AUTENTICAÇÃO ===
    async login(username, password) {
        const data = await this.request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        
        if (data.success) {
            this.token = data.token;
            localStorage.setItem('kinggroup_token', this.token);
        }
        
        return data;
    }

    async registerTestador(userData) {
        const data = await this.request('/api/auth/register-testador', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        
        if (data.success) {
            this.token = data.token;
            localStorage.setItem('kinggroup_token', this.token);
        }
        
        return data;
    }

    logout() {
        this.token = null;
        localStorage.removeItem('kinggroup_token');
    }

    isLoggedIn() {
        return !!this.token;
    }

    // === MAPAS OFFLINE ===
    async getRegions() {
        return await this.request('/api/maps/regions');
    }

    async downloadMap(mapData) {
        return await this.request('/api/maps/download', {
            method: 'POST',
            body: JSON.stringify(mapData)
        });
    }

    async getMapsStats() {
        return await this.request('/api/maps/stats');
    }

    // === ADMIN ===
    async getAdminStats() {
        return await this.request('/api/admin/stats');
    }
}

// Instância global da API
window.kingAPI = new KingGroupAPI();

// 🔐 SISTEMA DE AUTENTICAÇÃO
class AuthSystem {
    constructor() {
        this.setupLoginModal();
        this.setupRegisterModal();
    }

    setupLoginModal() {
        // Interceptar clique no botão de login
        document.addEventListener('click', (e) => {
            if (e.target.matches('.testador-btn, .login-btn')) {
                e.preventDefault();
                this.showLoginModal();
            }
        });
    }

    showLoginModal() {
        const modal = document.createElement('div');
        modal.className = 'auth-modal-overlay';
        modal.innerHTML = `
            <div class="auth-modal">
                <div class="auth-modal-header">
                    <h3>🔐 Login KingGroup</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="auth-modal-body">
                    <form id="loginForm">
                        <div class="form-group">
                            <label>👤 Usuário:</label>
                            <input type="text" id="loginUsername" required>
                        </div>
                        <div class="form-group">
                            <label>🔒 Senha:</label>
                            <div class="password-input">
                                <input type="password" id="loginPassword" required>
                                <button type="button" class="toggle-password">👁️</button>
                            </div>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn-primary">🚀 Entrar</button>
                            <button type="button" class="btn-secondary" onclick="authSystem.showRegisterModal()">
                                📝 Cadastrar-se
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.setupModalEvents(modal);
        this.setupPasswordToggle(modal);
        this.setupLoginForm();
    }

    showRegisterModal() {
        // Fechar modal de login se estiver aberto
        const existingModal = document.querySelector('.auth-modal-overlay');
        if (existingModal) existingModal.remove();

        const modal = document.createElement('div');
        modal.className = 'auth-modal-overlay';
        modal.innerHTML = `
            <div class="auth-modal register-modal">
                <div class="auth-modal-header">
                    <h3>📝 Cadastro de Testador</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="auth-modal-body">
                    <form id="registerForm">
                        <div class="form-row">
                            <div class="form-group">
                                <label>👤 Usuário:</label>
                                <input type="text" id="regUsername" required>
                            </div>
                            <div class="form-group">
                                <label>📧 Email:</label>
                                <input type="email" id="regEmail" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>🔒 Senha:</label>
                            <div class="password-input">
                                <input type="password" id="regPassword" required>
                                <button type="button" class="toggle-password">👁️</button>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>🌍 País:</label>
                                <select id="regCountry" required>
                                    <option value="">Selecione...</option>
                                    <option value="BR">🇧🇷 Brasil</option>
                                    <option value="US">🇺🇸 Estados Unidos</option>
                                    <option value="CA">🇨🇦 Canadá</option>
                                    <option value="MX">🇲🇽 México</option>
                                    <option value="AR">🇦🇷 Argentina</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>📍 Região:</label>
                                <input type="text" id="regRegion" placeholder="Estado/Província" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>🎫 Código de Convite (opcional):</label>
                            <input type="text" id="regInviteCode" placeholder="Deixe vazio se não tiver">
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn-primary">🚀 Cadastrar</button>
                            <button type="button" class="btn-secondary" onclick="authSystem.showLoginModal()">
                                🔐 Já tenho conta
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.setupModalEvents(modal);
        this.setupPasswordToggle(modal);
        this.setupRegisterForm();
    }

    setupModalEvents(modal) {
        // Fechar modal
        modal.querySelector('.close-modal').onclick = () => modal.remove();
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
    }

    setupPasswordToggle(modal) {
        modal.querySelectorAll('.toggle-password').forEach(btn => {
            btn.onclick = () => {
                const input = btn.previousElementSibling;
                if (input.type === 'password') {
                    input.type = 'text';
                    btn.textContent = '🙈';
                } else {
                    input.type = 'password';
                    btn.textContent = '👁️';
                }
            };
        });
    }

    setupLoginForm() {
        document.getElementById('loginForm').onsubmit = async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;
            
            try {
                this.showLoading('Fazendo login...');
                const result = await kingAPI.login(username, password);
                
                this.showSuccess('Login realizado com sucesso!');
                document.querySelector('.auth-modal-overlay').remove();
                this.updateUIAfterLogin();
                
            } catch (error) {
                this.showError('Erro no login: ' + error.message);
            }
        };
    }

    setupRegisterForm() {
        document.getElementById('registerForm').onsubmit = async (e) => {
            e.preventDefault();
            
            const userData = {
                username: document.getElementById('regUsername').value,
                email: document.getElementById('regEmail').value,
                password: document.getElementById('regPassword').value,
                country: document.getElementById('regCountry').value,
                region: document.getElementById('regRegion').value,
                invite_code: document.getElementById('regInviteCode').value
            };
            
            try {
                this.showLoading('Criando conta...');
                const result = await kingAPI.registerTestador(userData);
                
                this.showSuccess('Conta criada com sucesso! Licença válida por 30 dias.');
                document.querySelector('.auth-modal-overlay').remove();
                this.updateUIAfterLogin();
                
            } catch (error) {
                this.showError('Erro no cadastro: ' + error.message);
            }
        };
    }

    updateUIAfterLogin() {
        // Atualizar botões de login para mostrar status logado
        document.querySelectorAll('.testador-btn, .login-btn').forEach(btn => {
            btn.innerHTML = '✅ Logado';
            btn.style.background = '#28a745';
        });
    }

    showLoading(message) {
        this.showNotification(message, 'loading');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// 🗺️ SISTEMA DE MAPAS OFFLINE
class MapsSystem {
    constructor() {
        this.setupMapsInterface();
    }

    setupMapsInterface() {
        // Adicionar botão de mapas offline no menu
        this.addMapsButton();
    }

    addMapsButton() {
        // Procurar por um local adequado para adicionar o botão
        const sidebar = document.querySelector('.sidebar') || document.querySelector('nav');
        if (sidebar) {
            const mapsBtn = document.createElement('button');
            mapsBtn.className = 'maps-offline-btn';
            mapsBtn.innerHTML = '🗺️ Mapas Offline';
            mapsBtn.onclick = () => this.showMapsModal();
            sidebar.appendChild(mapsBtn);
        }
    }

    async showMapsModal() {
        if (!kingAPI.isLoggedIn()) {
            authSystem.showLoginModal();
            return;
        }

        try {
            const regions = await kingAPI.getRegions();
            
            const modal = document.createElement('div');
            modal.className = 'maps-modal-overlay';
            modal.innerHTML = `
                <div class="maps-modal">
                    <div class="maps-modal-header">
                        <h3>🗺️ Download de Mapas Offline</h3>
                        <button class="close-modal">&times;</button>
                    </div>
                    <div class="maps-modal-body">
                        <div class="maps-filters">
                            <select id="countryFilter">
                                <option value="">🌍 Todos os países</option>
                            </select>
                            <select id="typeFilter">
                                <option value="">🗺️ Todos os tipos</option>
                                <option value="standard">📍 Padrão</option>
                                <option value="satellite">🛰️ Satélite</option>
                                <option value="terrain">🏔️ Terreno</option>
                            </select>
                        </div>
                        <div class="maps-list" id="mapsList">
                            ${this.renderMapsList(regions.regions)}
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
            this.setupMapsModalEvents(modal);
            
        } catch (error) {
            authSystem.showError('Erro ao carregar mapas: ' + error.message);
        }
    }

    renderMapsList(regions) {
        return regions.map(region => `
            <div class="map-item ${region.is_premium ? 'premium' : ''}">
                <div class="map-info">
                    <h4>${region.country} ${region.state ? '- ' + region.state : ''} ${region.city ? '- ' + region.city : ''}</h4>
                    <p>📊 Tipo: ${region.map_type} | 💾 Tamanho: ${this.formatFileSize(region.file_size)}</p>
                    ${region.is_premium ? '<span class="premium-badge">👑 Premium</span>' : ''}
                </div>
                <button class="download-map-btn" onclick="mapsSystem.downloadMap('${JSON.stringify(region).replace(/'/g, "\\'")}')">
                    📥 Download
                </button>
            </div>
        `).join('');
    }

    setupMapsModalEvents(modal) {
        modal.querySelector('.close-modal').onclick = () => modal.remove();
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
    }

    async downloadMap(regionData) {
        const region = JSON.parse(regionData);
        
        try {
            authSystem.showLoading('Iniciando download...');
            
            const result = await kingAPI.downloadMap({
                country: region.country,
                state: region.state,
                city: region.city,
                map_type: region.map_type
            });
            
            authSystem.showSuccess(`Download iniciado! Tempo estimado: ${result.estimated_time}s`);
            
            // Simular download (em um app real, isso seria um download real)
            setTimeout(() => {
                authSystem.showSuccess('Download concluído!');
            }, result.estimated_time * 1000);
            
        } catch (error) {
            authSystem.showError('Erro no download: ' + error.message);
        }
    }

    formatFileSize(bytes) {
        if (!bytes) return 'N/A';
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }
}

// 🎨 ESTILOS CSS PARA AS NOVAS FUNCIONALIDADES
const styles = `
<style>
/* Modal de Autenticação */
.auth-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
}

.auth-modal {
    background: white;
    border-radius: 15px;
    width: 90%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.register-modal {
    max-width: 600px;
}

.auth-modal-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 20px;
    border-radius: 15px 15px 0 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.auth-modal-header h3 {
    margin: 0;
    font-size: 1.5em;
}

.close-modal {
    background: none;
    border: none;
    color: white;
    font-size: 24px;
    cursor: pointer;
    padding: 0;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.close-modal:hover {
    background: rgba(255, 255, 255, 0.2);
}

.auth-modal-body {
    padding: 30px;
}

.form-group {
    margin-bottom: 20px;
}

.form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
}

.form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: bold;
    color: #333;
}

.form-group input,
.form-group select {
    width: 100%;
    padding: 12px;
    border: 2px solid #ddd;
    border-radius: 8px;
    font-size: 16px;
    transition: border-color 0.3s;
}

.form-group input:focus,
.form-group select:focus {
    outline: none;
    border-color: #667eea;
}

.password-input {
    position: relative;
    display: flex;
}

.password-input input {
    flex: 1;
    padding-right: 50px;
}

.toggle-password {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    font-size: 18px;
    padding: 5px;
}

.form-actions {
    display: flex;
    gap: 15px;
    margin-top: 30px;
}

.btn-primary,
.btn-secondary {
    flex: 1;
    padding: 15px;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s;
}

.btn-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
    background: #f8f9fa;
    color: #333;
    border: 2px solid #ddd;
}

.btn-secondary:hover {
    background: #e9ecef;
}

/* Notificações */
.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 25px;
    border-radius: 8px;
    color: white;
    font-weight: bold;
    z-index: 10001;
    animation: slideIn 0.3s ease;
}

.notification.success {
    background: #28a745;
}

.notification.error {
    background: #dc3545;
}

.notification.loading {
    background: #007bff;
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

/* Modal de Mapas */
.maps-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
}

.maps-modal {
    background: white;
    border-radius: 15px;
    width: 90%;
    max-width: 800px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.maps-modal-header {
    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
    color: white;
    padding: 20px;
    border-radius: 15px 15px 0 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.maps-modal-body {
    padding: 30px;
}

.maps-filters {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
    margin-bottom: 30px;
}

.maps-list {
    display: grid;
    gap: 15px;
}

.map-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border: 2px solid #ddd;
    border-radius: 10px;
    transition: all 0.3s;
}

.map-item:hover {
    border-color: #28a745;
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(40, 167, 69, 0.2);
}

.map-item.premium {
    border-color: #ffc107;
    background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
}

.map-info h4 {
    margin: 0 0 10px 0;
    color: #333;
}

.map-info p {
    margin: 0;
    color: #666;
    font-size: 14px;
}

.premium-badge {
    background: #ffc107;
    color: #333;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: bold;
    margin-left: 10px;
}

.download-map-btn {
    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
    color: white;
    border: none;
    padding: 12px 20px;
    border-radius: 8px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s;
}

.download-map-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(40, 167, 69, 0.4);
}

.maps-offline-btn {
    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
    color: white;
    border: none;
    padding: 12px 20px;
    border-radius: 8px;
    font-weight: bold;
    cursor: pointer;
    margin: 10px;
    transition: all 0.3s;
}

.maps-offline-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(40, 167, 69, 0.4);
}

/* Responsividade */
@media (max-width: 768px) {
    .form-row {
        grid-template-columns: 1fr;
    }
    
    .maps-filters {
        grid-template-columns: 1fr;
    }
    
    .map-item {
        flex-direction: column;
        text-align: center;
        gap: 15px;
    }
    
    .form-actions {
        flex-direction: column;
    }
}
</style>
`;

// Adicionar estilos ao documento
document.head.insertAdjacentHTML('beforeend', styles);

// 🚀 INICIALIZAR SISTEMAS
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar sistemas
    window.authSystem = new AuthSystem();
    window.mapsSystem = new MapsSystem();
    
    console.log('🚀 KingGroup Systems initialized successfully!');
});

// 📱 SISTEMA DE DOWNLOADS DE APPS
class AppDownloadSystem {
    constructor() {
        this.setupDownloadButtons();
    }

    setupDownloadButtons() {
        // Interceptar cliques nos botões de download
        document.addEventListener('click', (e) => {
            if (e.target.matches('.download-btn, [onclick*="downloadApp"]')) {
                e.preventDefault();
                const appName = this.getAppNameFromButton(e.target);
                this.handleAppDownload(appName);
            }
        });
    }

    getAppNameFromButton(button) {
        // Extrair nome do app do botão ou elemento pai
        const card = button.closest('.app-card, .card, [class*="king"]');
        if (card) {
            const title = card.querySelector('h3, h2, .title, [class*="title"]');
            if (title) {
                return title.textContent.trim();
            }
        }
        return 'KingApp';
    }

    async handleAppDownload(appName) {
        if (!kingAPI.isLoggedIn()) {
            authSystem.showLoginModal();
            return;
        }

        try {
            authSystem.showLoading(`Preparando download do ${appName}...`);
            
            // Simular verificação de versão e preparação do download
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            authSystem.showSuccess(`Download do ${appName} iniciado!`);
            
            // Em um cenário real, aqui seria feito o download real do APK
            this.simulateDownload(appName);
            
        } catch (error) {
            authSystem.showError('Erro no download: ' + error.message);
        }
    }

    simulateDownload(appName) {
        // Simular progresso de download
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 20;
            if (progress >= 100) {
                clearInterval(interval);
                authSystem.showSuccess(`${appName} baixado com sucesso!`);
            }
        }, 500);
    }
}

// Inicializar sistema de downloads
document.addEventListener('DOMContentLoaded', () => {
    window.appDownloadSystem = new AppDownloadSystem();
});

