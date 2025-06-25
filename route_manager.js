// KingRoad - Sistema de Cancelamento Imediato de Rota
// Funcionalidade superior ao Truck Path - sem confirmações desnecessárias

class KingRoadRouteManager {
    constructor() {
        this.currentRoute = null;
        this.routeHistory = this.loadRouteHistory();
        this.isNavigating = false;
        this.routeStartTime = null;
    }

    // Carrega histórico de rotas do localStorage
    loadRouteHistory() {
        const saved = localStorage.getItem('kingroad_route_history');
        return saved ? JSON.parse(saved) : [];
    }

    // Salva histórico no localStorage
    saveRouteHistory() {
        localStorage.setItem('kingroad_route_history', JSON.stringify(this.routeHistory));
    }

    // Inicia uma nova rota
    startRoute(destination, origin = null) {
        const route = {
            id: Date.now(),
            destination: destination,
            origin: origin || 'Localização Atual',
            startTime: new Date(),
            status: 'active',
            distance: this.calculateDistance(origin, destination),
            estimatedTime: this.calculateETA(origin, destination)
        };

        this.currentRoute = route;
        this.isNavigating = true;
        this.routeStartTime = Date.now();

        // Adiciona ao histórico imediatamente
        this.addToHistory(route);

        // Notifica início da navegação
        this.showRouteNotification(`🗺️ Navegação iniciada para ${destination}`, 'info');
        
        // Atualiza interface
        this.updateNavigationUI();
        
        return route;
    }

    // CANCELAMENTO IMEDIATO - SEM CONFIRMAÇÃO!
    cancelRoute() {
        if (!this.currentRoute) {
            this.showRouteNotification('❌ Nenhuma rota ativa para cancelar', 'warning');
            return false;
        }

        const canceledRoute = { ...this.currentRoute };
        canceledRoute.status = 'canceled';
        canceledRoute.endTime = new Date();
        canceledRoute.duration = Date.now() - this.routeStartTime;

        // Atualiza no histórico (mantém a rota cancelada)
        this.updateRouteInHistory(canceledRoute);

        // Limpa rota atual
        this.currentRoute = null;
        this.isNavigating = false;
        this.routeStartTime = null;

        // Notificação de cancelamento (sem confirmação!)
        this.showRouteNotification(`⚡ Rota cancelada: ${canceledRoute.destination}`, 'success');
        
        // Atualiza interface
        this.updateNavigationUI();
        this.updateHistoryUI();

        return true;
    }

    // Reativa uma rota do histórico
    reactivateRoute(routeId) {
        const historicRoute = this.routeHistory.find(r => r.id === routeId);
        if (!historicRoute) {
            this.showRouteNotification('❌ Rota não encontrada no histórico', 'error');
            return false;
        }

        // Cria nova rota baseada na histórica
        const newRoute = {
            ...historicRoute,
            id: Date.now(), // Novo ID
            startTime: new Date(),
            status: 'active',
            endTime: null,
            duration: null
        };

        this.currentRoute = newRoute;
        this.isNavigating = true;
        this.routeStartTime = Date.now();

        // Adiciona nova instância ao histórico
        this.addToHistory(newRoute);

        this.showRouteNotification(`🔄 Rota reativada: ${newRoute.destination}`, 'success');
        this.updateNavigationUI();

        return true;
    }

    // Adiciona rota ao histórico
    addToHistory(route) {
        // Remove rotas muito antigas (mantém últimas 50)
        if (this.routeHistory.length >= 50) {
            this.routeHistory = this.routeHistory.slice(-49);
        }

        this.routeHistory.push({ ...route });
        this.saveRouteHistory();
        this.updateHistoryUI();
    }

    // Atualiza rota existente no histórico
    updateRouteInHistory(updatedRoute) {
        const index = this.routeHistory.findIndex(r => r.id === updatedRoute.id);
        if (index !== -1) {
            this.routeHistory[index] = { ...updatedRoute };
            this.saveRouteHistory();
        }
    }

    // Calcula distância estimada (simulado)
    calculateDistance(origin, destination) {
        // Em produção, usar API de mapas real
        return Math.floor(Math.random() * 500) + 10; // 10-510 km
    }

    // Calcula tempo estimado (simulado)
    calculateETA(origin, destination) {
        const distance = this.calculateDistance(origin, destination);
        return Math.floor(distance / 80 * 60); // ~80km/h média, resultado em minutos
    }

    // Atualiza interface de navegação
    updateNavigationUI() {
        const navContainer = document.getElementById('navigationStatus');
        if (!navContainer) return;

        if (this.isNavigating && this.currentRoute) {
            navContainer.innerHTML = `
                <div class="active-route">
                    <div class="route-header">
                        <h3>🗺️ Navegando para</h3>
                        <button onclick="routeManager.cancelRoute()" class="cancel-btn">
                            ⚡ Cancelar
                        </button>
                    </div>
                    <div class="route-details">
                        <div class="destination">${this.currentRoute.destination}</div>
                        <div class="route-info">
                            <span>📍 ${this.currentRoute.distance}km</span>
                            <span>⏱️ ${this.currentRoute.estimatedTime}min</span>
                            <span>🕐 ${this.formatTime(this.currentRoute.startTime)}</span>
                        </div>
                    </div>
                </div>
            `;
        } else {
            navContainer.innerHTML = `
                <div class="no-route">
                    <p>🗺️ Nenhuma navegação ativa</p>
                    <button onclick="routeManager.showQuickDestinations()" class="quick-route-btn">
                        ⚡ Rotas Rápidas
                    </button>
                </div>
            `;
        }
    }

    // Atualiza interface do histórico
    updateHistoryUI() {
        const historyContainer = document.getElementById('routeHistory');
        if (!historyContainer) return;

        const recentRoutes = this.routeHistory.slice(-10).reverse(); // Últimas 10, mais recentes primeiro

        historyContainer.innerHTML = `
            <div class="history-header">
                <h3>📋 Últimos Destinos</h3>
                <button onclick="routeManager.clearHistory()" class="clear-btn">🗑️ Limpar</button>
            </div>
            <div class="history-list">
                ${recentRoutes.map(route => `
                    <div class="history-item ${route.status}" data-route-id="${route.id}">
                        <div class="route-icon">${this.getRouteIcon(route.status)}</div>
                        <div class="route-info">
                            <div class="destination">${route.destination}</div>
                            <div class="route-meta">
                                <span>${route.distance}km</span>
                                <span>${this.formatTime(route.startTime)}</span>
                                <span class="status-${route.status}">${this.getStatusText(route.status)}</span>
                            </div>
                        </div>
                        <div class="route-actions">
                            <button onclick="routeManager.reactivateRoute(${route.id})" class="reactivate-btn">
                                🔄 Usar
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Mostra destinos rápidos
    showQuickDestinations() {
        const quickDestinations = [
            '🏠 Casa', '🏢 Trabalho', '⛽ Posto mais próximo', 
            '🍕 Restaurante', '🏥 Hospital', '🛒 Supermercado'
        ];

        const modal = document.createElement('div');
        modal.className = 'quick-destinations-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>⚡ Destinos Rápidos</h3>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
                </div>
                <div class="destinations-grid">
                    ${quickDestinations.map(dest => `
                        <button onclick="routeManager.startQuickRoute('${dest}')" class="quick-dest-btn">
                            ${dest}
                        </button>
                    `).join('')}
                </div>
                <div class="custom-destination">
                    <input type="text" id="customDestination" placeholder="Digite um destino...">
                    <button onclick="routeManager.startCustomRoute()">🗺️ Ir</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    // Inicia rota rápida
    startQuickRoute(destination) {
        this.startRoute(destination);
        document.querySelector('.quick-destinations-modal')?.remove();
    }

    // Inicia rota customizada
    startCustomRoute() {
        const input = document.getElementById('customDestination');
        const destination = input?.value?.trim();
        
        if (destination) {
            this.startRoute(destination);
            document.querySelector('.quick-destinations-modal')?.remove();
        } else {
            this.showRouteNotification('❌ Digite um destino válido', 'error');
        }
    }

    // Limpa histórico
    clearHistory() {
        this.routeHistory = [];
        this.saveRouteHistory();
        this.updateHistoryUI();
        this.showRouteNotification('🗑️ Histórico limpo', 'info');
    }

    // Utilitários
    getRouteIcon(status) {
        const icons = {
            active: '🟢',
            completed: '✅',
            canceled: '⚡',
            default: '🗺️'
        };
        return icons[status] || icons.default;
    }

    getStatusText(status) {
        const texts = {
            active: 'Ativa',
            completed: 'Concluída',
            canceled: 'Cancelada'
        };
        return texts[status] || 'Desconhecido';
    }

    formatTime(date) {
        return new Date(date).toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    showRouteNotification(message, type = 'info') {
        // Reutiliza sistema de notificações existente
        if (typeof showNotification === 'function') {
            showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
}

// Inicialização global
const routeManager = new KingRoadRouteManager();

// Funções globais para uso na interface
function cancelCurrentRoute() {
    return routeManager.cancelRoute();
}

function startNewRoute(destination, origin = null) {
    return routeManager.startRoute(destination, origin);
}

function reactivateHistoryRoute(routeId) {
    return routeManager.reactivateRoute(routeId);
}

// Auto-inicialização quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    routeManager.updateNavigationUI();
    routeManager.updateHistoryUI();
    
    console.log('🗺️ KingRoad Route Manager inicializado');
    console.log('⚡ Cancelamento imediato ativo - sem confirmações!');
});

// CSS para estilização (adicionar ao arquivo CSS principal)
const routeManagerStyles = `
.active-route {
    background: linear-gradient(135deg, #d4af37, #f4d03f);
    border-radius: 12px;
    padding: 16px;
    margin: 16px 0;
    color: #000;
}

.route-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.cancel-btn {
    background: #ff4444;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: bold;
    transition: all 0.2s;
}

.cancel-btn:hover {
    background: #cc0000;
    transform: scale(1.05);
}

.route-details .destination {
    font-size: 1.2em;
    font-weight: bold;
    margin-bottom: 8px;
}

.route-info {
    display: flex;
    gap: 16px;
    font-size: 0.9em;
}

.history-item {
    display: flex;
    align-items: center;
    padding: 12px;
    border-radius: 8px;
    margin: 8px 0;
    background: rgba(255,255,255,0.1);
    transition: all 0.2s;
}

.history-item:hover {
    background: rgba(255,255,255,0.2);
    transform: translateX(4px);
}

.history-item.canceled {
    border-left: 4px solid #ff4444;
}

.history-item.completed {
    border-left: 4px solid #44ff44;
}

.reactivate-btn {
    background: #4CAF50;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.8em;
}

.quick-destinations-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.destinations-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 12px;
    margin: 16px 0;
}

.quick-dest-btn {
    background: linear-gradient(135deg, #d4af37, #f4d03f);
    border: none;
    padding: 12px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: bold;
    transition: all 0.2s;
}

.quick-dest-btn:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.4);
}
`;

// Injeta CSS se não existir
if (!document.getElementById('route-manager-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'route-manager-styles';
    styleSheet.textContent = routeManagerStyles;
    document.head.appendChild(styleSheet);
}

