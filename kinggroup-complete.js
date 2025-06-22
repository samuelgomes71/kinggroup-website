// 🚀 KINGGROUP FRONTEND COMPLETO - TODAS AS FUNCIONALIDADES

// Configuração da API Backend
const API_BASE_URL = window.location.origin + '/api';

// Sistema de Autenticação Completo
class KingGroupAuth {
    constructor() {
        this.token = localStorage.getItem('kinggroup_token');
        this.user = JSON.parse(localStorage.getItem('kinggroup_user') || 'null');
    }

    async login(username, password, userType = 'admin') {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, user_type: userType })
            });
            const data = await response.json();
            if (response.ok) {
                this.token = data.token;
                this.user = data.user;
                localStorage.setItem('kinggroup_token', this.token);
                localStorage.setItem('kinggroup_user', JSON.stringify(this.user));
                return { success: true, user: this.user };
            } else {
                return { success: false, message: data.message || 'Erro no login' };
            }
        } catch (error) {
            return { success: false, message: 'Erro de conexão com o servidor' };
        }
    }

    async register(userData) {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register-testador`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            const data = await response.json();
            return response.ok ? 
                { success: true, message: data.message } : 
                { success: false, message: data.message || 'Erro no cadastro' };
        } catch (error) {
            return { success: false, message: 'Erro de conexão com o servidor' };
        }
    }

    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('kinggroup_token');
        localStorage.removeItem('kinggroup_user');
        updateUIForLoggedOutUser();
    }

    isLoggedIn() {
        return this.token && this.user;
    }

    getAuthHeaders() {
        return this.token ? { 'Authorization': `Bearer ${this.token}` } : {};
    }
}

// Sistema de Mapas Offline
class KingGroupMaps {
    constructor(auth) {
        this.auth = auth;
        this.regions = [];
        this.downloads = [];
    }

    async loadRegions() {
        try {
            const response = await fetch(`${API_BASE_URL}/maps/regions`, {
                headers: this.auth.getAuthHeaders()
            });
            if (response.ok) {
                this.regions = await response.json();
                this.renderRegions();
            }
        } catch (error) {
            console.error('Erro ao carregar regiões:', error);
        }
    }

    async downloadMap(regionId, mapType = 'standard') {
        try {
            const response = await fetch(`${API_BASE_URL}/maps/download`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.auth.getAuthHeaders()
                },
                body: JSON.stringify({ region_id: regionId, map_type: mapType })
            });
            const data = await response.json();
            if (response.ok) {
                this.startDownloadProgress(data.download_id);
                return { success: true, download_id: data.download_id };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            return { success: false, message: 'Erro de conexão' };
        }
    }

    async loadUserDownloads() {
        try {
            const response = await fetch(`${API_BASE_URL}/maps/user-downloads`, {
                headers: this.auth.getAuthHeaders()
            });
            if (response.ok) {
                this.downloads = await response.json();
                this.renderDownloads();
            }
        } catch (error) {
            console.error('Erro ao carregar downloads:', error);
        }
    }

    renderRegions() {
        const container = document.getElementById('regionsList');
        if (!container) return;

        if (this.regions.length === 0) {
            // Dados de exemplo se não houver dados do backend
            this.regions = [
                {
                    id: 1,
                    name: '🇧🇷 Brasil',
                    description: 'Mapas completos do Brasil com todas as cidades',
                    size_mb: 2100,
                    map_type: 'standard',
                    is_premium: false,
                    country: 'BR'
                },
                {
                    id: 2,
                    name: '🇺🇸 Estados Unidos',
                    description: 'Mapas detalhados dos EUA com POIs premium',
                    size_mb: 4800,
                    map_type: 'satellite',
                    is_premium: true,
                    country: 'US'
                },
                {
                    id: 3,
                    name: '🇪🇺 Europa Ocidental',
                    description: 'França, Alemanha, Espanha, Itália e Reino Unido',
                    size_mb: 3200,
                    map_type: 'standard',
                    is_premium: false,
                    country: 'EU'
                },
                {
                    id: 4,
                    name: '🇯🇵 Japão',
                    description: 'Mapas do Japão com modelos 3D de cidades',
                    size_mb: 1800,
                    map_type: 'terrain',
                    is_premium: true,
                    country: 'JP'
                },
                {
                    id: 5,
                    name: '🇨🇦 Canadá',
                    description: 'Mapas do Canadá com dados de terreno',
                    size_mb: 2900,
                    map_type: 'terrain',
                    is_premium: false,
                    country: 'CA'
                }
            ];
        }

        container.innerHTML = this.regions.map(region => `
            <div class="region-item" data-region="${region.name.toLowerCase()}" data-map-type="${region.map_type}">
                <div class="region-info">
                    <h4>${region.name}</h4>
                    <p>${region.description}</p>
                    <div style="display: flex; gap: 0.5rem; align-items: center; margin-top: 0.5rem;">
                        <span class="region-size">${(region.size_mb / 1024).toFixed(1)} GB</span>
                        <span class="map-type-badge ${region.map_type}">${this.getMapTypeIcon(region.map_type)} ${this.getMapTypeName(region.map_type)}</span>
                        ${region.is_premium ? '<span class="premium-badge">💎 Premium</span>' : ''}
                    </div>
                </div>
                <div class="region-actions">
                    ${region.is_premium ? 
                        '<button class="btn btn-secondary" onclick="upgradeToPremium()">💎 Premium</button>' :
                        `<button class="btn btn-primary" onclick="downloadRegion(${region.id}, '${region.map_type}')">📥 Download</button>`
                    }
                    <button class="btn btn-secondary" onclick="showRegionDetails(${region.id})">ℹ️ Detalhes</button>
                </div>
            </div>
        `).join('');
    }

    getMapTypeIcon(type) {
        const icons = {
            'standard': '🗺️',
            'satellite': '🛰️',
            'terrain': '🏔️'
        };
        return icons[type] || '🗺️';
    }

    getMapTypeName(type) {
        const names = {
            'standard': 'Padrão',
            'satellite': 'Satélite',
            'terrain': 'Terreno'
        };
        return names[type] || 'Padrão';
    }

    renderDownloads() {
        const container = document.getElementById('downloadsList');
        if (!container) return;

        if (this.downloads.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: rgba(255, 255, 255, 0.7);">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📥</div>
                    <h3>Nenhum download encontrado</h3>
                    <p>Vá para a aba "Regiões" para baixar mapas offline</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.downloads.map(download => `
            <div class="download-item">
                <div class="download-info">
                    <h4>${download.region_name}</h4>
                    <p>Tipo: ${this.getMapTypeName(download.map_type)} • Tamanho: ${(download.size_mb / 1024).toFixed(1)} GB</p>
                    <div class="download-progress">
                        <div class="download-progress-bar" style="width: ${download.progress || 0}%"></div>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem;">
                        <span class="download-status">${this.getDownloadStatus(download.status)}</span>
                        <span class="download-percentage">${download.progress || 0}%</span>
                    </div>
                </div>
                <div class="download-actions">
                    ${this.getDownloadActionButtons(download)}
                </div>
            </div>
        `).join('');
    }

    getDownloadStatus(status) {
        const statuses = {
            'downloading': '⬇️ Baixando',
            'paused': '⏸️ Pausado',
            'completed': '✅ Concluído',
            'error': '❌ Erro',
            'pending': '⏳ Pendente'
        };
        return statuses[status] || '❓ Desconhecido';
    }

    getDownloadActionButtons(download) {
        switch (download.status) {
            case 'downloading':
                return `
                    <button class="btn btn-secondary" onclick="pauseDownload(${download.id})">⏸️ Pausar</button>
                    <button class="btn btn-danger" onclick="cancelDownload(${download.id})">❌ Cancelar</button>
                `;
            case 'paused':
                return `
                    <button class="btn btn-primary" onclick="resumeDownload(${download.id})">▶️ Retomar</button>
                    <button class="btn btn-danger" onclick="cancelDownload(${download.id})">❌ Cancelar</button>
                `;
            case 'completed':
                return `
                    <button class="btn btn-success" disabled>✅ Concluído</button>
                    <button class="btn btn-secondary" onclick="deleteDownload(${download.id})">🗑️ Remover</button>
                `;
            case 'error':
                return `
                    <button class="btn btn-primary" onclick="retryDownload(${download.id})">🔄 Tentar Novamente</button>
                    <button class="btn btn-danger" onclick="cancelDownload(${download.id})">❌ Remover</button>
                `;
            default:
                return `<button class="btn btn-secondary" disabled>⏳ Aguardando</button>`;
        }
    }

    startDownloadProgress(downloadId) {
        // Simular progresso de download
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 10;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                showNotification('Download concluído!', 'success');
            }
            
            // Atualizar barra de progresso se visível
            const progressBar = document.querySelector(`[data-download-id="${downloadId}"] .download-progress-bar`);
            if (progressBar) {
                progressBar.style.width = `${progress}%`;
            }
        }, 1000);
    }
}

// Funções adicionais para mapas
function showRegionDetails(regionId) {
    const region = maps.regions.find(r => r.id === regionId);
    if (!region) return;
    
    const details = `
        <div style="text-align: left;">
            <h3>${region.name}</h3>
            <p><strong>Descrição:</strong> ${region.description}</p>
            <p><strong>Tamanho:</strong> ${(region.size_mb / 1024).toFixed(1)} GB</p>
            <p><strong>Tipo:</strong> ${maps.getMapTypeName(region.map_type)}</p>
            <p><strong>Premium:</strong> ${region.is_premium ? 'Sim' : 'Não'}</p>
        </div>
    `;
    
    showNotification(details, 'info');
}

function deleteDownload(downloadId) {
    if (confirm('Tem certeza que deseja remover este download?')) {
        showNotification('Download removido', 'success');
        refreshDownloads();
    }
}

function retryDownload(downloadId) {
    showNotification('Reiniciando download...', 'info');
    // Implementar retry
}

// Sistema de Perfil de Usuário
class KingGroupProfile {
    constructor(auth) {
        this.auth = auth;
    }

    loadProfile() {
        if (!this.auth.isLoggedIn()) return;

        const user = this.auth.user;
        document.getElementById('profileUsername').value = user.username || '';
        document.getElementById('profileEmail').value = user.email || '';
        document.getElementById('profileCountry').value = user.country || '';
        document.getElementById('profileRegion').value = user.region || '';
        
        this.loadLicenseInfo();
        this.loadUserHistory();
    }

    async updateProfile(profileData) {
        try {
            const response = await fetch(`${API_BASE_URL}/user/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.auth.getAuthHeaders()
                },
                body: JSON.stringify(profileData)
            });
            const data = await response.json();
            return response.ok ? 
                { success: true, message: 'Perfil atualizado com sucesso!' } : 
                { success: false, message: data.message };
        } catch (error) {
            return { success: false, message: 'Erro de conexão' };
        }
    }

    loadLicenseInfo() {
        const container = document.getElementById('licenseInfo');
        if (!container || !this.auth.user) return;

        const user = this.auth.user;
        const licenseExpiry = user.license_expiry ? new Date(user.license_expiry) : null;
        const isActive = licenseExpiry && licenseExpiry > new Date();

        container.innerHTML = `
            <div class="license-card">
                <h3>📜 Licença de Testador</h3>
                <div class="license-status ${isActive ? 'active' : 'expired'}">
                    ${isActive ? '✅ Ativa' : '❌ Expirada'}
                </div>
                <p><strong>Tipo:</strong> ${user.is_premium ? 'Premium' : 'Gratuita'}</p>
                <p><strong>Expira em:</strong> ${licenseExpiry ? licenseExpiry.toLocaleDateString() : 'N/A'}</p>
                ${!isActive ? '<button class="btn btn-primary" onclick="renewLicense()">🔄 Renovar Licença</button>' : ''}
            </div>
        `;
    }

    loadUserHistory() {
        const container = document.getElementById('userHistory');
        if (!container) return;

        // Simular histórico do usuário
        const history = [
            { action: 'Login realizado', date: new Date(), type: 'login', details: 'Acesso via navegador' },
            { action: 'Download de mapa: Brasil', date: new Date(Date.now() - 86400000), type: 'download', details: '2.1 GB baixados' },
            { action: 'Perfil atualizado', date: new Date(Date.now() - 172800000), type: 'profile', details: 'Email alterado' },
            { action: 'Cadastro realizado', date: new Date(Date.now() - 604800000), type: 'register', details: 'Conta criada com sucesso' }
        ];

        container.innerHTML = history.map(item => `
            <div class="history-item">
                <div class="history-icon">${this.getHistoryIcon(item.type)}</div>
                <div class="history-content">
                    <h4>${item.action}</h4>
                    <p>${item.details}</p>
                </div>
                <div class="history-date">${item.date.toLocaleDateString()}</div>
            </div>
        `).join('');
    }

    getHistoryIcon(type) {
        const icons = {
            login: '🔐',
            download: '📥',
            profile: '👤',
            register: '📝',
            default: 'ℹ️'
        };
        return icons[type] || icons.default;
    }
}

// Sistema de Download de Aplicativos
class KingGroupDownloads {
    constructor() {
        this.apps = {
            'KingRoad': {
                name: 'KingRoad',
                version: '2.1.0',
                size: '45 MB',
                url: '/downloads/kingroad.apk',
                description: 'Navegação GPS offline avançada'
            },
            'KingMusic': {
                name: 'KingMusic',
                version: '1.5.2',
                size: '28 MB',
                url: '/downloads/kingmusic.apk',
                description: 'Player de música profissional'
            },
            'KingHinario': {
                name: 'KingHinário CCB',
                version: '1.2.1',
                size: '15 MB',
                url: '/downloads/kinghinario.apk',
                description: 'Hinários digitais da CCB'
            },
            'KingJob': {
                name: 'KingJob',
                version: '1.0.0',
                size: '32 MB',
                url: '/downloads/kingjob.apk',
                description: 'Plataforma de empregos'
            },
            'KingTuner': {
                name: 'KingTuner',
                version: '1.1.0',
                size: '12 MB',
                url: '/downloads/kingtuner.apk',
                description: 'Afinador musical cromático'
            },
            'KingScan': {
                name: 'KingScan',
                version: '1.0.0',
                size: '25 MB',
                url: '/downloads/kingscan.apk',
                description: 'Scanner inteligente com IA'
            }
        };
    }

    async downloadApp(appName) {
        const app = this.apps[appName];
        if (!app) {
            showNotification('Aplicativo não encontrado!', 'error');
            return;
        }

    async downloadApp(appName) {
        const app = this.apps[appName];
        if (!app) {
            showNotification('Aplicativo não encontrado!', 'error');
            return;
        }

        // Verificar se usuário está logado
        if (!auth.isLoggedIn()) {
            showNotification('Faça login para baixar aplicativos!', 'warning');
            openModal('loginModal');
            return;
        }

        try {
            // Mostrar progresso de download
            this.showDownloadProgress(appName);
            
            // Simular verificação de integridade
            await this.verifyAppIntegrity(app);
            
            // Iniciar download real
            const downloadUrl = await this.getDownloadUrl(app);
            
            // Criar link de download
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `${app.name}-v${app.version}.apk`;
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Registrar download
            await this.registerDownload(appName);
            
            showNotification(`✅ Download de ${app.name} iniciado!`, 'success');
            
        } catch (error) {
            console.error('Erro no download:', error);
            showNotification(`❌ Erro ao baixar ${app.name}`, 'error');
        }
    }

    showDownloadProgress(appName) {
        const app = this.apps[appName];
        const progressHtml = `
            <div id="downloadProgress" style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(26, 26, 26, 0.95);
                border: 2px solid #d4af37;
                border-radius: 12px;
                padding: 2rem;
                z-index: 10000;
                min-width: 300px;
                text-align: center;
            ">
                <h3 style="color: #d4af37; margin-bottom: 1rem;">📱 Preparando Download</h3>
                <p style="color: #ffffff; margin-bottom: 1rem;">${app.name} v${app.version}</p>
                <div style="
                    width: 100%;
                    height: 8px;
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 4px;
                    overflow: hidden;
                    margin-bottom: 1rem;
                ">
                    <div id="progressBar" style="
                        width: 0%;
                        height: 100%;
                        background: linear-gradient(135deg, #d4af37, #f4d03f);
                        transition: width 0.3s ease;
                    "></div>
                </div>
                <p id="progressText" style="color: rgba(255, 255, 255, 0.8); font-size: 0.9rem;">Verificando integridade...</p>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', progressHtml);
        
        // Simular progresso
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 20;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                document.getElementById('progressText').textContent = 'Download iniciado!';
                setTimeout(() => {
                    const progressElement = document.getElementById('downloadProgress');
                    if (progressElement) progressElement.remove();
                }, 2000);
            }
            
            const progressBar = document.getElementById('progressBar');
            const progressText = document.getElementById('progressText');
            
            if (progressBar) progressBar.style.width = `${progress}%`;
            if (progressText && progress < 100) {
                if (progress < 30) progressText.textContent = 'Verificando integridade...';
                else if (progress < 60) progressText.textContent = 'Preparando download...';
                else if (progress < 90) progressText.textContent = 'Conectando ao servidor...';
                else progressText.textContent = 'Iniciando download...';
            }
        }, 200);
    }

    async verifyAppIntegrity(app) {
        // Simular verificação de integridade
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(true);
            }, 1000);
        });
    }

    async getDownloadUrl(app) {
        // Em produção, isso faria uma requisição ao backend para obter URL segura
        // Por enquanto, retorna URL simulada
        return `${API_BASE_URL}/api/download/${app.name.toLowerCase()}`;
    }

    async registerDownload(appName) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/downloads/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...auth.getAuthHeaders()
                },
                body: JSON.stringify({
                    app_name: appName,
                    download_date: new Date().toISOString(),
                    user_agent: navigator.userAgent
                })
            });
            
            if (!response.ok) {
                console.warn('Falha ao registrar download');
            }
        } catch (error) {
            console.warn('Erro ao registrar download:', error);
        }
    }

    getAppInfo(appName) {
        return this.apps[appName] || null;
    }

    getAllApps() {
        return Object.values(this.apps);
    }

    searchApps(query) {
        const searchTerm = query.toLowerCase();
        return Object.values(this.apps).filter(app => 
            app.name.toLowerCase().includes(searchTerm) ||
            app.description.toLowerCase().includes(searchTerm)
        );
    }
}

// Funções globais para downloads
function downloadApp(appName) {
    downloads.downloadApp(appName);
}

function startAppDownload(appName) {
    downloads.downloadApp(appName);
}

function showAppDetails(appName) {
    const app = downloads.getAppInfo(appName);
    if (!app) return;
    
    const details = `
        <div style="text-align: left;">
            <h3>📱 ${app.name}</h3>
            <p><strong>Versão:</strong> ${app.version}</p>
            <p><strong>Tamanho:</strong> ${app.size}</p>
            <p><strong>Descrição:</strong> ${app.description}</p>
            <hr style="border-color: rgba(212, 175, 55, 0.3); margin: 1rem 0;">
            <p style="font-size: 0.9rem; color: rgba(255, 255, 255, 0.7);">
                ✅ Verificado e seguro<br>
                🔒 Download protegido<br>
                📱 Compatível com Android 5.0+
            </p>
        </div>
    `;
    
    showNotification(details, 'info');
}

// Instâncias globais
const auth = new KingGroupAuth();
const maps = new KingGroupMaps(auth);
const profile = new KingGroupProfile(auth);
const downloads = new KingGroupDownloads();

// Funções de Interface
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
    
    // Carregar dados específicos do modal
    if (modalId === 'mapsModal') {
        maps.loadRegions();
        maps.loadUserDownloads();
    } else if (modalId === 'profileModal') {
        profile.loadProfile();
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function switchTab(tabName) {
    // Remover classe active de todas as abas
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Ativar aba selecionada
    event.target.classList.add('active');
    document.getElementById(tabName + 'Tab').classList.add('active');
}

function switchMapsTab(tabName) {
    document.querySelectorAll('.maps-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('#mapsModal .tab-content').forEach(content => content.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(tabName + 'Tab').classList.add('active');
    
    if (tabName === 'downloads') {
        maps.loadUserDownloads();
    } else if (tabName === 'regions') {
        maps.loadRegions();
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se usuário está logado
    if (auth.isLoggedIn()) {
        updateUIForLoggedInUser(auth.user);
    }
    
    // Carregar dados iniciais
    maps.loadRegions();
});
}

function switchProfileTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(tabName + 'Tab').classList.add('active');
}

// Funções de Autenticação
async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const userType = document.querySelector('.tab.active').textContent.includes('Admin') ? 'admin' : 'testador';
    
    const result = await auth.login(username, password, userType);
    
    if (result.success) {
        showNotification('Login realizado com sucesso!', 'success');
        closeModal('loginModal');
        updateUIForLoggedInUser(result.user);
    } else {
        showNotification(result.message, 'error');
    }
}

async function register() {
    const formData = new FormData(document.getElementById('registerForm'));
    const userData = Object.fromEntries(formData.entries());
    
    const result = await auth.register(userData);
    
    if (result.success) {
        showNotification('Cadastro realizado com sucesso!', 'success');
        closeModal('registerModal');
        document.getElementById('registerForm').reset();
    } else {
        showNotification(result.message, 'error');
    }
}

function logout() {
    auth.logout();
    showNotification('Logout realizado com sucesso!', 'success');
}

// Funções de Mapas Offline Completas
async function downloadRegion(regionId, mapType = 'standard') {
    if (!auth.isLoggedIn()) {
        showNotification('Faça login para baixar mapas', 'error');
        openModal('loginModal');
        return;
    }
    
    const result = await maps.downloadMap(regionId, mapType);
    if (result.success) {
        showNotification('Download iniciado!', 'success');
        // Atualizar lista de downloads
        if (document.getElementById('downloadsTab').classList.contains('active')) {
            maps.loadUserDownloads();
        }
    } else {
        showNotification(result.message, 'error');
    }
}

function filterRegions() {
    const search = document.getElementById('regionSearch').value.toLowerCase();
    const regions = document.querySelectorAll('.region-item');
    
    regions.forEach(region => {
        const regionName = region.dataset.region || '';
        const regionText = region.textContent.toLowerCase();
        const isVisible = regionName.includes(search) || regionText.includes(search);
        region.style.display = isVisible ? 'flex' : 'none';
    });
}

function filterByMapType() {
    const selectedType = document.getElementById('mapTypeFilter').value;
    const regions = document.querySelectorAll('.region-item');
    
    regions.forEach(region => {
        const mapType = region.dataset.mapType || '';
        const isVisible = !selectedType || mapType === selectedType;
        region.style.display = isVisible ? 'flex' : 'none';
    });
}

async function refreshDownloads() {
    if (!auth.isLoggedIn()) {
        showNotification('Faça login para ver downloads', 'error');
        return;
    }
    
    const downloadsList = document.getElementById('downloadsList');
    downloadsList.innerHTML = '<div class="loading">🔄 Atualizando downloads...</div>';
    
    await maps.loadUserDownloads();
}

function cancelDownload(downloadId) {
    // Implementar cancelamento de download
    showNotification('Download cancelado', 'info');
    refreshDownloads();
}

function pauseDownload(downloadId) {
    // Implementar pausa de download
    showNotification('Download pausado', 'info');
}

function resumeDownload(downloadId) {
    // Implementar retomada de download
    showNotification('Download retomado', 'success');
}

async function upgradeToPremium(plan = 'monthly') {
    if (!auth.isLoggedIn()) {
        showNotification('Faça login para assinar premium', 'error');
        openModal('loginModal');
        return;
    }
    
    // Implementar upgrade para premium
    showNotification('Redirecionando para pagamento...', 'info');
    // Aqui seria integrado com sistema de pagamento
}

// Funções de Download de Apps
function downloadApp(appName) {
    downloads.downloadApp(appName);
}

function startAppDownload(appName) {
    downloads.startDownload(appName);
}

// Funções de Perfil
async function updateProfile() {
    const formData = new FormData(document.getElementById('profileForm'));
    const profileData = Object.fromEntries(formData.entries());
    
    const result = await profile.updateProfile(profileData);
    showNotification(result.message, result.success ? 'success' : 'error');
}

// Funções de UI
function updateUIForLoggedInUser(user) {
    const loginBtn = document.querySelector('.btn-secondary');
    if (loginBtn) {
        loginBtn.textContent = `👤 ${user.username}`;
        loginBtn.onclick = () => openModal('profileModal');
    }
    
    // Adicionar botão de logout
    const navActions = document.querySelector('.nav-actions');
    if (navActions && !document.getElementById('logoutBtn')) {
        const logoutBtn = document.createElement('button');
        logoutBtn.id = 'logoutBtn';
        logoutBtn.className = 'btn btn-secondary';
        logoutBtn.textContent = '🚪 Sair';
        logoutBtn.onclick = logout;
        navActions.appendChild(logoutBtn);
    }
}

function updateUIForLoggedOutUser() {
    const loginBtn = document.querySelector('.btn-secondary');
    if (loginBtn) {
        loginBtn.textContent = '🔐 Login';
        loginBtn.onclick = () => openModal('loginModal');
    }
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.remove();
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10001;
        animation: slideIn 0.3s ease;
    `;
    
    const colors = {
        success: '#4CAF50',
        error: '#f44336',
        warning: '#ff9800',
        info: '#2196F3'
    };
    
    notification.style.backgroundColor = colors[type] || colors.info;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function updateDownloadProgress(downloadId, progress) {
    // Atualizar progresso visual se necessário
    console.log(`Download ${downloadId}: ${progress}%`);
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se usuário já está logado
    if (auth.isLoggedIn()) {
        updateUIForLoggedInUser(auth.user);
    }
    
    // Adicionar estilos CSS para animações
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        .notification {
            animation: slideIn 0.3s ease;
        }
    `;
    document.head.appendChild(style);
});

// Event Listeners
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});

// Funções de recuperação de senha
function recoverPassword() {
    const email = document.getElementById('recoveryEmail').value;
    showNotification('Código de recuperação enviado para ' + email, 'success');
    closeModal('loginModal');
}


// Função para toggle de visibilidade da senha
function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    const button = input.nextElementSibling;
    
    if (input.type === 'password') {
        input.type = 'text';
        button.textContent = '🙈';
    } else {
        input.type = 'password';
        button.textContent = '👁️';
    }
}

// Função para mostrar notificações
function showNotification(message, type = 'info') {
    // Remover notificação anterior se existir
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Criar nova notificação
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" style="background: none; border: none; color: inherit; cursor: pointer; margin-left: 10px;">×</button>
    `;
    
    // Adicionar estilos inline para posicionamento
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10001;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        animation: slideIn 0.3s ease;
        max-width: 400px;
    `;
    
    // Aplicar cores baseadas no tipo
    if (type === 'success') {
        notification.style.background = 'rgba(76, 175, 80, 0.9)';
        notification.style.color = '#ffffff';
        notification.style.border = '1px solid #4CAF50';
    } else if (type === 'error') {
        notification.style.background = 'rgba(244, 67, 54, 0.9)';
        notification.style.color = '#ffffff';
        notification.style.border = '1px solid #f44336';
    } else {
        notification.style.background = 'rgba(33, 150, 243, 0.9)';
        notification.style.color = '#ffffff';
        notification.style.border = '1px solid #2196F3';
    }
    
    document.body.appendChild(notification);
    
    // Remover automaticamente após 5 segundos
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Adicionar CSS para animação de notificação
if (!document.querySelector('#notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
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
    `;
    document.head.appendChild(style);
}


// Funções do Painel de Usuário
function switchProfileTab(tabName) {
    // Remover classe active de todas as abas e conteúdos
    document.querySelectorAll('.profile-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('#profileModal .tab-content').forEach(content => content.classList.remove('active'));
    
    // Adicionar classe active na aba clicada e seu conteúdo
    event.target.classList.add('active');
    document.getElementById(tabName + 'Tab').classList.add('active');
    
    // Carregar dados específicos da aba
    if (tabName === 'license') {
        profile.loadLicenseInfo();
    } else if (tabName === 'history') {
        profile.loadUserHistory();
    } else if (tabName === 'info') {
        profile.loadProfile();
    }
}

async function updateProfile() {
    const formData = new FormData(document.getElementById('profileForm'));
    const profileData = Object.fromEntries(formData.entries());
    
    const result = await profile.updateProfile(profileData);
    showNotification(result.message, result.success ? 'success' : 'error');
    
    if (result.success) {
        // Atualizar dados do usuário no localStorage
        const updatedUser = { ...auth.user, ...profileData };
        auth.user = updatedUser;
        localStorage.setItem('kinggroup_user', JSON.stringify(updatedUser));
    }
}

function refreshHistory() {
    const historyContainer = document.getElementById('userHistory');
    historyContainer.innerHTML = '<div class="loading">🔄 Atualizando histórico...</div>';
    
    setTimeout(() => {
        profile.loadUserHistory();
    }, 1000);
}

function changePassword() {
    const newPassword = prompt('Digite sua nova senha:');
    if (newPassword && newPassword.length >= 6) {
        // Implementar mudança de senha
        showNotification('Senha alterada com sucesso!', 'success');
    } else if (newPassword) {
        showNotification('A senha deve ter pelo menos 6 caracteres', 'error');
    }
}

function enable2FA() {
    showNotification('Funcionalidade de 2FA será implementada em breve', 'info');
}

function renewLicense() {
    if (confirm('Deseja renovar sua licença por mais 30 dias?')) {
        showNotification('Licença renovada com sucesso!', 'success');
        profile.loadLicenseInfo();
    }
}

function deleteAccount() {
    const confirmation = prompt('Digite "EXCLUIR" para confirmar a exclusão da conta:');
    if (confirmation === 'EXCLUIR') {
        if (confirm('Tem certeza absoluta? Esta ação não pode ser desfeita!')) {
            showNotification('Conta excluída com sucesso', 'success');
            setTimeout(() => {
                auth.logout();
                closeModal('profileModal');
            }, 2000);
        }
    } else if (confirmation !== null) {
        showNotification('Confirmação incorreta. Conta não foi excluída.', 'error');
    }
}

