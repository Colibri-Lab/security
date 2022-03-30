

App.Modules.Security = class extends Colibri.Modules.Module {

    /** @constructor */
    constructor() {
        super('Security');
    }

    

    InitializeModule() {

        this.userData = {};
        this._pages = {};
        this._pageMap = {
            profile: {
                route: '/security/profile/',
                handle: () => {
                    Colibri.Common.Wait(() => this._store.Query('security.user').id).then(() => {
                        if(this.IsCommandAllowed('security.profile')) {
                    
                            if(!this._pages['profile']) {
                                this._pages['profile'] = new App.Modules.Security.ProfileWindow('profile', document.body);
                            }
                            this._pages['profile'].Show();
                            
                        }
                        else {
                            App.Notices && App.Notices.Add({
                                severity: 'error',
                                title: 'Действие запрещено',
                                timeout: 5000
                            });
                        }
                    });
                    
                }
            },
            administrate: {
                className: 'App.Modules.Security.AdministratePage', 
                title: 'Администрирование',
                color: 'orange',
                route: '/security/administrate/'
            }
            
        }
        this._loginForm = null;

        this._store = App.Store.AddChild('app.security', {});
        this._store.AddPathLoader('security.roles', () => this.Roles(true));

        this._store.AddPathHandler('security.settings', (data) => {
            if(!data.logged) {
                this.LoginForm.Show();
            }
        });


        console.log('Initializing module Security');

        App.AddHandler('ApplicationReady', (event, args) => {
            this.Render(document.body);
            this.Settings();
        });

        App.Router.AddRoutePattern('/logout/', (url, options) => {
            this.Logout();
            App.Router.Navigate('', {});
        });

        Object.forEach(this._pageMap, (name, info) => {
            App.Router.AddRoutePattern(info.route, info.handle ?? ((url, options) => this.ShowPage(name)));
        });

    }

    Render(container) {
        console.log('Rendering Module Security');
        

    }

    RegisterEvents() {
        console.log('Registering module events for Security');
        

    }

    RegisterEventHandlers() {
        console.log('Registering event handlers for Security');

        this.AddHandler('RoutedToModule', (event, args) => {
            
        });

        this.AddHandler('RoutedToSelf', (event, args) => {
            Colibri.Common.Wait(() => this._store.Query('security.user').id).then(() => {
                if(this.IsCommandAllowed('security.profile')) {
                    this.ProfileWindow.Show();
                }
                else {
                    App.Notices && App.Notices.Add({
                        severity: 'error',
                        title: 'Действие запрещено',
                        timeout: 5000
                    });
                }
            });
        });

        this.AddHandler('RoutedToUsers', (event, args) => this.ShowPage('users'));
        this.AddHandler('RoutedToRoles', (event, args) => this.ShowPage('roles'));
        this.AddHandler('RoutedToPermissions', (event, args) => this.ShowPage('permission'));

    }

    ShowPage(name) {
        Colibri.Common.Wait(() => this._store.Query('security.user').id).then(() => {
            if(this.IsCommandAllowed('security.' + name)) {
        
                const pageInfo = this._pageMap[name];
                const componentClass = pageInfo.className;
                const title = pageInfo.title;
                const route = pageInfo.route;

                const componentObject = eval(componentClass);
                if(!componentObject) {
                    return;
                }

                let container = null;
                if(!this._pages[componentClass]) {

                    container = MainFrame.AddTab(componentClass, title, 'orange', true, name + '-container', () => {
                        this.RemovePage(name);
                    }, route);    

                    if(!this._pages[componentClass]) {
                        this._pages[componentClass] = new componentObject(name, container);
                    }
                    if(!this._pages[componentClass].isConnected) {
                        this._pages[componentClass].ConnectTo(container);
                    }
                    this._pages[componentClass].Show();

                }
                else if(MainFrame) {
                    MainFrame.SelectTab(this._pages[componentClass].parent);
                }

            }
            else {
                App.Notices && App.Notices.Add({
                    severity: 'error',
                    title: 'Действие запрещено',
                    timeout: 5000
                });
            }
        });


    }

    RemovePage(name) {
        const pageInfo = this._pageMap[name];
        const componentClass = pageInfo.className;

        if(this._pages[componentClass]) {
            this._pages[componentClass].Dispose();
            this._pages[componentClass].parent.Dispose();
            this._pages[componentClass] = null;
        }
    }

    Menu(isadmin) {

        const userData = this._store.Query('security.user');

        let profile = [];
        profile.push({title: userData.fio.firstName + ' ' + userData.fio.lastName, route: ''});
        profile.push({title: 'Личный кабинет', route: '/app/more/security/profile/', icon: Colibri.UI.LkIcon,});
        if(isadmin) {
            profile.push({title: 'Администрирование', route: '/app/more/security/users/', icon: Colibri.UI.AdministrationIcon,});
        }

        let menu = {
            profile: profile
        };
        
        this._store.Set('security.menu', menu);
    }


    Settings(returnPromise = false) {
        const promise = this.Call('Client', 'Settings')
        if(returnPromise) {
            return promise;
        }

        promise.then((response) => {
            this._store.Set('security.settings', response.result.settings);
            this._store.Set('security.user', response.result.user);
            this.Menu(false);
        }).catch((response) => {
            App.Notices && App.Notices.Add({
                severity: 'error',
                title: response.result,
                timeout: 5000
            });
        });
    }

    Roles(returnPromise = false) {
        const promise = this.Call('Client', 'Roles')
        if(returnPromise) {
            return promise;
        }

        promise.then((response) => {
            this._store.Set('security.roles', response.result);
        }).catch((response) => {
            App.Notices && App.Notices.Add({
                severity: 'error',
                title: response.result,
                timeout: 5000
            });
        });
    }

    Login(login, password) {
        this.Call('Client', 'Login', {login: login, password: password})
            .then((response) => {
                App.Notices.Add({
                    severity: 'success',
                    title: 'Вы успешно вошли в систему, пожалуйста, подождите пока мы произведем запуск!',
                    timeout: 5000
                });
                Colibri.Common.Delay(5000).then(() => {
                    location.reload();
                });
            })
            .catch(error => {
                App.Notices.Add({
                    severity: 'error',
                    title: error.result,
                    timeout: 5000
                });
                console.error(error);
            });

    }

    Logout(noreload) {
        this.Call('Client', 'Logout')
            .then((response) => {

                App.Notices.Add({
                    severity: 'success',
                    title: 'До свидания!',
                    timeout: 5000
                });
                Colibri.Common.Delay(5000).then(() => {
                    location.reload();
                });

            })
            .catch(error => {
                App.Notices.Add({
                    severity: 'error',
                    title: error.result,
                    timeout: 5000
                });
                console.error(error);
            });
    }

    Register(value) {
        this.Call('Client', 'Register', value)
            .then((response) => {
                App.Notices.Add({
                    severity: 'success',
                    title: 'Вы успешно зарегистрировались, пожалуйста, проверьте почтовый ящик',
                    timeout: 5000
                });
                Colibri.Common.Delay(5000).then(() => {
                    location.reload();
                });
            })
            .catch(error => {
                App.Notices.Add({
                    severity: 'error',
                    title: error.result,
                    timeout: 5000
                });
                console.error(error);
            });
    }

    SaveUser(value) {
        this.Call('Client', 'Save', value)
            .then((response) => {
                
                this._store.Set('security.user', response.result);

                App.Notices.Add({
                    severity: 'success',
                    title: 'Данные успешно сохранены',
                    timeout: 5000
                });

            })
            .catch(error => {
                App.Notices.Add({
                    severity: 'error',
                    title: error.result,
                    timeout: 5000
                });
                console.error(error);
            });
    }

    ResetRequest(value) {
        this.Call('Client', 'ResetRequest', value)
            .then((response) => {
                App.Notices.Add({
                    severity: 'success',
                    title: 'Запрос на восстановление успешно отправлен вам на почту, пожалуйста, перейдите по ссылке в письме!',
                    timeout: 5000
                });
                Colibri.Common.Delay(5000).then(() => {
                    location.reload();
                });
            })
            .catch(error => {
                App.Notices.Add({
                    severity: 'success',
                    title: error.result,
                    timeout: 5000
                });
                console.error(error);
            });
    }


    get LoginForm() {
        if(this._loginForm) {
            return this._loginForm;
        }
        
        this._loginForm = new App.Modules.Security.Login('login-form', document.body);
        if(!this._loginForm.isConnected) {
            this._loginForm.ConnectTo(document.body);
        }

        return this._loginForm;
    }

    get ProfileWindow() {
        if(this._profileForm) {
            return this._profileForm;
        }

        this._profileForm = new App.Modules.Security.ProfileWindow('profile-window', document.body);
        if(!this._profileForm.isConnected) {
            this._profileForm.ConnectTo(document.body);
        }

        return this._profileForm;
    }

    get Store() {
        return this._store;
    }

    IsCommandAllowed(command) {
        // реализовать проверку

        const user = this._store.Query('security.user');
        const role = user.role;

        const userPermissions = user.permissions;
        const rolePermissions = role.permissions;

        let perms = rolePermissions.concat(userPermissions);
        perms.sort((a, b) => {
            if(a.path > b.path) {
                return -1;
            }
            else if(a.path < b.path) {
                return 1;
            }
            return 0;
        });

        for(const perm of perms) {
            const reg = new RegExp(perm.path.replace(/\./, '\.').replace(/\*/, '.*'), 'im');
            if(reg.test(command) !== false) {
                return perm.value === 'allow';
            }
        }

        return false;
        
    }
    

}

const Security = new App.Modules.Security();
