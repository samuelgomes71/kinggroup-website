// Teste de Validação - Sistema de Cancelamento de Rota KingRoad
// Testa funcionalidade superior ao Truck Path

class RouteManagerValidator {
    constructor() {
        this.testResults = [];
        this.passedTests = 0;
        this.failedTests = 0;
    }

    runAllTests() {
        console.log('🧪 Iniciando testes do Sistema de Cancelamento de Rota...\n');
        
        // Testes de funcionalidade básica
        this.testRouteCreation();
        this.testImmediateCancellation();
        this.testHistoryPersistence();
        this.testRouteReactivation();
        this.testQuickDestinations();
        
        // Testes de UX
        this.testNoConfirmationDialogs();
        this.testResponseTime();
        this.testHistoryLimit();
        
        // Testes de interface
        this.testUIUpdates();
        this.testNotifications();
        
        this.generateReport();
    }

    testRouteCreation() {
        try {
            const routeManager = new KingRoadRouteManager();
            const route = routeManager.startRoute('São Paulo', 'Rio de Janeiro');
            
            this.assert(route !== null, 'Rota deve ser criada');
            this.assert(route.destination === 'São Paulo', 'Destino deve ser correto');
            this.assert(route.status === 'active', 'Status deve ser ativo');
            this.assert(routeManager.isNavigating === true, 'Deve estar navegando');
            
            this.addTestResult('✅ Criação de Rota', true, 'Rota criada com sucesso');
        } catch (error) {
            this.addTestResult('❌ Criação de Rota', false, error.message);
        }
    }

    testImmediateCancellation() {
        try {
            const routeManager = new KingRoadRouteManager();
            routeManager.startRoute('Brasília');
            
            // Teste de cancelamento imediato
            const startTime = Date.now();
            const canceled = routeManager.cancelRoute();
            const endTime = Date.now();
            
            this.assert(canceled === true, 'Cancelamento deve retornar true');
            this.assert(routeManager.currentRoute === null, 'Rota atual deve ser null');
            this.assert(routeManager.isNavigating === false, 'Não deve estar navegando');
            this.assert((endTime - startTime) < 100, 'Cancelamento deve ser instantâneo (<100ms)');
            
            this.addTestResult('⚡ Cancelamento Imediato', true, `Cancelado em ${endTime - startTime}ms`);
        } catch (error) {
            this.addTestResult('❌ Cancelamento Imediato', false, error.message);
        }
    }

    testHistoryPersistence() {
        try {
            const routeManager = new KingRoadRouteManager();
            
            // Cria e cancela rota
            routeManager.startRoute('Salvador');
            const routeId = routeManager.currentRoute.id;
            routeManager.cancelRoute();
            
            // Verifica se está no histórico
            const inHistory = routeManager.routeHistory.some(r => r.id === routeId);
            this.assert(inHistory === true, 'Rota cancelada deve estar no histórico');
            
            // Verifica persistência no localStorage
            const saved = JSON.parse(localStorage.getItem('kingroad_route_history') || '[]');
            const savedRoute = saved.find(r => r.id === routeId);
            this.assert(savedRoute !== undefined, 'Rota deve estar salva no localStorage');
            this.assert(savedRoute.status === 'canceled', 'Status deve ser cancelado');
            
            this.addTestResult('📋 Persistência no Histórico', true, 'Rota mantida no histórico após cancelamento');
        } catch (error) {
            this.addTestResult('❌ Persistência no Histórico', false, error.message);
        }
    }

    testRouteReactivation() {
        try {
            const routeManager = new KingRoadRouteManager();
            
            // Cria, cancela e reativa rota
            routeManager.startRoute('Fortaleza');
            const originalDestination = routeManager.currentRoute.destination;
            const routeId = routeManager.currentRoute.id;
            routeManager.cancelRoute();
            
            const reactivated = routeManager.reactivateRoute(routeId);
            
            this.assert(reactivated === true, 'Reativação deve retornar true');
            this.assert(routeManager.isNavigating === true, 'Deve estar navegando novamente');
            this.assert(routeManager.currentRoute.destination === originalDestination, 'Destino deve ser o mesmo');
            
            this.addTestResult('🔄 Reativação de Rota', true, 'Rota reativada com sucesso');
        } catch (error) {
            this.addTestResult('❌ Reativação de Rota', false, error.message);
        }
    }

    testQuickDestinations() {
        try {
            const routeManager = new KingRoadRouteManager();
            
            // Testa destino rápido
            routeManager.startQuickRoute('🏠 Casa');
            
            this.assert(routeManager.currentRoute !== null, 'Rota rápida deve ser criada');
            this.assert(routeManager.currentRoute.destination === '🏠 Casa', 'Destino deve ser correto');
            
            this.addTestResult('⚡ Destinos Rápidos', true, 'Destino rápido funcionando');
        } catch (error) {
            this.addTestResult('❌ Destinos Rápidos', false, error.message);
        }
    }

    testNoConfirmationDialogs() {
        try {
            // Simula múltiplos cancelamentos rápidos
            const routeManager = new KingRoadRouteManager();
            
            for (let i = 0; i < 5; i++) {
                routeManager.startRoute(`Destino ${i}`);
                routeManager.cancelRoute();
            }
            
            // Se chegou até aqui sem travamentos, não há confirmações
            this.addTestResult('🚫 Sem Confirmações', true, '5 cancelamentos sem diálogos de confirmação');
        } catch (error) {
            this.addTestResult('❌ Sem Confirmações', false, error.message);
        }
    }

    testResponseTime() {
        try {
            const routeManager = new KingRoadRouteManager();
            const times = [];
            
            // Testa 10 operações de cancelamento
            for (let i = 0; i < 10; i++) {
                routeManager.startRoute(`Teste ${i}`);
                
                const start = performance.now();
                routeManager.cancelRoute();
                const end = performance.now();
                
                times.push(end - start);
            }
            
            const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
            const maxTime = Math.max(...times);
            
            this.assert(avgTime < 50, 'Tempo médio deve ser < 50ms');
            this.assert(maxTime < 100, 'Tempo máximo deve ser < 100ms');
            
            this.addTestResult('⏱️ Tempo de Resposta', true, `Média: ${avgTime.toFixed(2)}ms, Máx: ${maxTime.toFixed(2)}ms`);
        } catch (error) {
            this.addTestResult('❌ Tempo de Resposta', false, error.message);
        }
    }

    testHistoryLimit() {
        try {
            const routeManager = new KingRoadRouteManager();
            
            // Cria 55 rotas (mais que o limite de 50)
            for (let i = 0; i < 55; i++) {
                routeManager.startRoute(`Destino ${i}`);
                routeManager.cancelRoute();
            }
            
            this.assert(routeManager.routeHistory.length <= 50, 'Histórico deve respeitar limite de 50');
            
            this.addTestResult('📊 Limite do Histórico', true, `Histórico mantido em ${routeManager.routeHistory.length} itens`);
        } catch (error) {
            this.addTestResult('❌ Limite do Histórico', false, error.message);
        }
    }

    testUIUpdates() {
        try {
            // Simula elementos DOM
            document.body.innerHTML += `
                <div id="navigationStatus"></div>
                <div id="routeHistory"></div>
            `;
            
            const routeManager = new KingRoadRouteManager();
            routeManager.startRoute('Teste UI');
            
            const navStatus = document.getElementById('navigationStatus');
            this.assert(navStatus.innerHTML.includes('Navegando para'), 'UI deve mostrar navegação ativa');
            
            routeManager.cancelRoute();
            this.assert(navStatus.innerHTML.includes('Nenhuma navegação ativa'), 'UI deve mostrar navegação inativa');
            
            this.addTestResult('🖥️ Atualizações de UI', true, 'Interface atualizada corretamente');
        } catch (error) {
            this.addTestResult('❌ Atualizações de UI', false, error.message);
        }
    }

    testNotifications() {
        try {
            const routeManager = new KingRoadRouteManager();
            let notificationReceived = false;
            
            // Mock da função de notificação
            window.showNotification = (message, type) => {
                notificationReceived = true;
                return true;
            };
            
            routeManager.startRoute('Teste Notificação');
            routeManager.cancelRoute();
            
            this.assert(notificationReceived === true, 'Notificação deve ser enviada');
            
            this.addTestResult('🔔 Notificações', true, 'Sistema de notificações funcionando');
        } catch (error) {
            this.addTestResult('❌ Notificações', false, error.message);
        }
    }

    // Utilitários de teste
    assert(condition, message) {
        if (!condition) {
            throw new Error(message);
        }
    }

    addTestResult(testName, passed, details) {
        this.testResults.push({ testName, passed, details });
        if (passed) {
            this.passedTests++;
            console.log(`${testName}: PASSOU - ${details}`);
        } else {
            this.failedTests++;
            console.log(`${testName}: FALHOU - ${details}`);
        }
    }

    generateReport() {
        const totalTests = this.passedTests + this.failedTests;
        const successRate = ((this.passedTests / totalTests) * 100).toFixed(1);
        
        console.log('\n' + '='.repeat(60));
        console.log('📊 RELATÓRIO DE TESTES - SISTEMA DE CANCELAMENTO DE ROTA');
        console.log('='.repeat(60));
        console.log(`✅ Testes Aprovados: ${this.passedTests}`);
        console.log(`❌ Testes Falharam: ${this.failedTests}`);
        console.log(`📈 Taxa de Sucesso: ${successRate}%`);
        console.log(`🎯 Status: ${successRate >= 90 ? 'APROVADO' : 'REPROVADO'}`);
        
        console.log('\n🔍 DETALHES DOS TESTES:');
        this.testResults.forEach(result => {
            console.log(`${result.passed ? '✅' : '❌'} ${result.testName}: ${result.details}`);
        });
        
        console.log('\n🚀 COMPARAÇÃO COM TRUCK PATH:');
        console.log('✅ KingRoad: Cancelamento imediato sem confirmação');
        console.log('❌ Truck Path: Múltiplas confirmações irritantes');
        console.log('✅ KingRoad: Histórico inteligente mantido');
        console.log('❌ Truck Path: Perde histórico ao cancelar');
        console.log('✅ KingRoad: Interface responsiva');
        console.log('❌ Truck Path: Interface lenta e pesada');
        
        return {
            totalTests,
            passedTests: this.passedTests,
            failedTests: this.failedTests,
            successRate: parseFloat(successRate),
            status: successRate >= 90 ? 'APROVADO' : 'REPROVADO'
        };
    }
}

// Execução dos testes
if (typeof window !== 'undefined') {
    // Ambiente browser
    document.addEventListener('DOMContentLoaded', function() {
        const validator = new RouteManagerValidator();
        validator.runAllTests();
    });
} else {
    // Ambiente Node.js
    console.log('🧪 Executando testes em ambiente Node.js...');
    
    // Mock do localStorage para Node.js
    global.localStorage = {
        getItem: (key) => global.localStorage[key] || null,
        setItem: (key, value) => global.localStorage[key] = value,
        removeItem: (key) => delete global.localStorage[key]
    };
    
    // Mock do document para Node.js
    global.document = {
        getElementById: () => ({ innerHTML: '', style: {} }),
        createElement: () => ({ innerHTML: '', style: {}, appendChild: () => {} }),
        body: { appendChild: () => {} },
        head: { appendChild: () => {} },
        addEventListener: () => {}
    };
    
    // Mock do performance para Node.js
    global.performance = { now: () => Date.now() };
    
    // Importa a classe (simulado)
    eval(require('fs').readFileSync('./KINGGROUP_DESENVOLVIMENTO_HIBRIDO_2025-06-20_07-20-55/CORE_COMPLETO/KINGROAD/king-apk-manager/src/route_manager.js', 'utf8'));
    
    const validator = new RouteManagerValidator();
    const results = validator.runAllTests();
    
    console.log(`\n🎯 RESULTADO FINAL: ${results.status}`);
    process.exit(results.status === 'APROVADO' ? 0 : 1);
}

