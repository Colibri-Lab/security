

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
                            Manage.FormWindow.Show('Личный кабинет', 800, 'app.manage.storages(users)', this._store.Query('security.user'))
                                .then((data) => {
                                    this.SaveUser(data);
                                })
                                .catch(() => {});
                        }
                        else {
                            App.Notices.Add(new Colibri.UI.Notice('Действие запрещено', Colibri.UI.Notice.Error, 5000));
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
        this._store.AddPathLoader('security.users', () => this.Users(true));

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
                    this.FormWindow.Show('Личный кабинет', 800, 'app.manage.storages(users)', 'app.security.user')
                        .then((data) => {
                            this.SaveUser(data);
                        })
                        .catch(() => {});
                }
                else {
                    App.Notices.Add(new Colibri.UI.Notice('Действие запрещено', Colibri.UI.Notice.Error, 5000));
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

    Users(returnPromise = false) {
        const promise = this.Call('Client', 'Users')
        if(returnPromise) {
            return promise;
        }

        promise.then((response) => {
            this._store.Set('security.users', response.result);
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
                App.Notices.Add(new Colibri.UI.Notice('Вы успешно вошли в систему, пожалуйста, подождите пока мы произведем запуск!', Colibri.UI.Notice.Success, 3000));
                Colibri.Common.Delay(3000).then(() => {
                    location.reload();
                });
            })
            .catch(error => {
                App.Notices.Add(new Colibri.UI.Notice(error.result));
                console.error(error);
            });

    }

    Logout(noreload) {
        this.Call('Client', 'Logout')
            .then((response) => {
                App.Notices.Add(new Colibri.UI.Notice('До свидания!', Colibri.UI.Notice.Success, 3000));
                Colibri.Common.Delay(3000).then(() => {
                    location.reload();
                });

            })
            .catch(error => {
                App.Notices.Add(new Colibri.UI.Notice(error.result));
                console.error(error);
            });
    }

    Register(value) {
        this.Call('Client', 'Register', value)
            .then((response) => {
                App.Notices.Add(new Colibri.UI.Notice('Вы успешно зарегистрировались, пожалуйста, проверьте почтовый ящик', Colibri.UI.Notice.Success, 3000));
                Colibri.Common.Delay(3000).then(() => {
                    location.reload();
                });
            })
            .catch(error => {
                App.Notices.Add(new Colibri.UI.Notice(error.result));
                console.error(error);
            });
    }

    SaveUser(value) {
        this.Call('Client', 'SaveUser', value)
            .then((response) => {
                const currentUser = this._store.Query('security.user');
                const savedUser = response.result;
                if(savedUser.id == currentUser.id) {
                    this._store.Set('security.user', response.result);                    
                }

                let users = this._store.Query('security.users');
                let isAdd = true;
                users = users.map((u) => {
                    if(u.id == savedUser.id) {
                        isAdd = false;
                        return savedUser;
                    }
                    else {
                        return u;
                    }
                });
                if(isAdd) {
                    users.push(savedUser);
                }
                this._store.Set('security.users', users);

                App.Notices.Add(new Colibri.UI.Notice('Данные успешно сохранены', Colibri.UI.Notice.Success, 3000));
            })
            .catch(error => {
                App.Notices.Add(new Colibri.UI.Notice(error.result));
                console.error(error);
            });
    }

    SaveRole(value) {
        this.Call('Client', 'SaveRole', value)
            .then((response) => {
                const role = response.result;
                let roles = this._store.Query('security.roles');
                let isAdd = true;
                roles = roles.map((r) => {
                    if(r.id == role.id) {
                        isAdd = false;
                        return role;
                    }
                    else {
                        return r;
                    }
                });
                if(isAdd) {
                    roles.push(role);
                }
                this._store.Set('security.roles', roles);
                this._store.DispatchPath('security.users');
                App.Notices.Add(new Colibri.UI.Notice('Данные успешно сохранены', Colibri.UI.Notice.Success, 3000));
            })
            .catch(error => {
                App.Notices.Add(new Colibri.UI.Notice(error.result));
                console.error(error);
            });
    }

    RemoveRole(value) {
        this.Call('Client', 'RemoveRole', value)
            .then((response) => {
                let roles = this._store.Query('security.roles');
                let newRoles = [];
                roles.map((r) => {
                    if(r.id != value.id) {
                        newRoles.push(r);
                    }
                });
                this._store.Set('security.roles', newRoles);
                this._store.Reload('security.users', false);
                App.Notices.Add(new Colibri.UI.Notice('Данные успешно удалены', Colibri.UI.Notice.Success, 3000));
            })
            .catch(error => {
                App.Notices.Add(new Colibri.UI.Notice(error.result));
                console.error(error);
            });
    }

    RemoveUser(value) {
        this.Call('Client', 'RemoveUser', value)
            .then((response) => {
                let users = this._store.Query('security.users');
                let newUsers = [];
                users.map((u) => {
                    if(u.id != value.id) {
                        newUsers.push(u);
                    }
                });
                console.log(newUsers);
                this._store.Set('security.users', newUsers);
                App.Notices.Add(new Colibri.UI.Notice('Данные успешно удалены', Colibri.UI.Notice.Success, 3000));
            })
            .catch(error => {
                App.Notices.Add(new Colibri.UI.Notice(error.result));
                console.error(error);
            });
    }

    ResetRequest(value) {
        this.Call('Client', 'ResetRequest', value)
            .then((response) => {
                App.Notices.Add(new Colibri.UI.Notice('Запрос на восстановление успешно отправлен вам на почту, пожалуйста, перейдите по ссылке в письме!', Colibri.UI.Notice.Success, 3000));
                Colibri.Common.Delay(3000).then(() => {
                    location.reload();
                });
            })
            .catch(error => {
                App.Notices.Add(new Colibri.UI.Notice(error.result));
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


    get Store() {
        return this._store;
    }

    GetUserPermissions(userOrRole = null) {

        let perms = [];
        if(!userOrRole || userOrRole.role !== undefined) {
            const user = userOrRole || this._store.Query('security.user');
            const role = user.role;
    
            const userPermissions = user.permissions;
            const rolePermissions = role.permissions;
    
            perms = rolePermissions.concat(userPermissions);    
        }
        else {
            perms = userOrRole.permissions;
        }

        perms.sort((a, b) => {
            if(a.path > b.path) {
                return -1;
            }
            else if(a.path < b.path) {
                return 1;
            }
            return 0;
        });
        return perms;
    }

    IsCommandSet(command, userOrRole = null) {
        const perms = this.GetUserPermissions(userOrRole);
        
        for(const perm of perms) {
            if(command == perm.path) {
                return perm.value;
            }
        }

        return null;
    }

    IsCommandAllowed(command, userOrRole = null) {
        // реализовать проверку

        let isNot = false;
        if(command.substr(0, 1) == '!') {
            isNot = true;
            command = command.substr(1);
        }

        const perms = this.GetUserPermissions(userOrRole);

        for(const perm of perms) {
            const reg = new RegExp(perm.path.replace(/\./, '\.').replace(/\*/, '.*'), 'im');
            if(reg.test(command) !== false) {
                return isNot ? perm.value !== 'allow' : perm.value === 'allow';
            }
        }

        return isNot ? true : false;
        
    }

    RemovePermission(perms, perm) {
        let found = -1;
        perms.forEach((p, i) => {
            if(p.path == perm) {
                found = i;
                return false;
            }
            return true;
        });
        perms.splice(found, 1);
        return perms;
    }

    AddPermission(perms, perm, acc) {
        if(!Array.isArray(perms)) {
            perms = [];
        }
        perms.push({path: perm, value: acc});
        return perms;
    }
    
    

}

App.Modules.Security.Icons = {};
App.Modules.Security.Icons.PermissionNotSetIcon =               '<svg xmlns="http://www.w3.org/2000/svg" width="2083" height="2083" viewBox="0 0 2083 2083"><path fill="#585858" d="M1357.13,174.069c45.29-1.109,69.25,16.113,98.23,31.043,45.82,23.611,88.82,48.952,130.98,75.512,18.1,11.4,40.69,22.956,53.73,39.433,12.66,16.006,22.26,35.607,27.7,58.731,8.02,34.046-5.47,61.417-12.59,86.418q-3.36,20.554-6.72,41.112c-13.73,79.87,25.66,164.183,55.42,206.4a306.766,306.766,0,0,0,126.77,103.2c22.97,10.05,49.94,12.1,75.56,21.814,36.57,13.857,66.43,44.391,78.09,83.062,8.88,29.463,8.18,70.494,9.23,104.04,2.47,78.89,6.04,172.23-28.54,217.3-33.16,43.22-88.82,45.01-141.05,67.96-56.17,24.68-102.22,70.87-132.66,121.66-26.17,43.67-53.11,115.83-40.3,189.62,7,40.29,28.56,77.91,17.63,124.17-19.1,80.9-116.06,116.78-180.51,154.38-28,16.34-59.8,35.95-93.19,45.3-45.2,12.67-89.17-9.04-112.5-27.68q-15.12-16.365-30.23-32.72c-49.24-39.63-95.89-63.71-173.79-77.19-16.06-2.78-37.65-4.63-55.41-1.68-75.523,12.54-125.6,32.7-173.794,70.48q-20.988,21.39-41.979,42.79c-25.2,19.9-77.4,39.78-120.9,22.65-62.6-24.66-119.546-61.5-173.792-95.65-38.262-24.08-71.8-44.32-86.477-92.29-14.573-47.64,7.531-92.07,15.113-135.92,12.455-72.03-18.614-151.05-43.658-191.3-30.922-49.68-76.892-93.75-132.654-118.3-49.838-21.93-103.856-23.07-136.011-63.76-34.163-43.23-36.951-137.73-31.9-218.14,2.184-34.81-.668-74.833,8.4-104.881C116.4,884.9,145.26,855.04,179.2,841.084c27.224-11.194,57.956-14.184,83.118-25.17,64.725-28.26,115.415-80.1,146.927-141.794,14.826-29.026,40.659-99.923,32.743-148.5q-2.519-23.07-5.037-46.146Q428.978,450.947,421,422.417c-10.576-53.769,20.754-98.288,48.7-118.3,57.992-41.537,122.2-80.761,190.585-110.75,30.447-13.352,62.62-26.3,104.947-12.585,39.056,12.653,54.107,42.218,82.278,64.6,43.6,34.643,134.034,85.888,221.654,71.316,69.63-11.581,118.47-28.769,163.71-62.926,25.34-19.124,41.83-47.3,69.69-63.765C1318.63,180.511,1337.6,181.963,1357.13,174.069ZM1030.25,355.011l-69,4.7c-58.36,10.71-113.436,19.651-163.1,39.178C599.5,476.987,458.828,618.45,380.981,817.311c-16.05,41-24.989,86.787-34.5,133.2-22.027,107.474-2.582,240.1,26.661,322.824,74.5,210.75,205.759,356.03,407.755,438.79,65.927,27.02,202.639,69.33,307.386,51.72,61.46-10.33,116.85-14.81,169.37-31.34,214.96-67.65,368.26-221.87,448.53-424.69,58.56-147.94,54.27-358.627-4.7-501.479C1599.45,559.183,1378.94,353.947,1030.25,355.011Z"/></svg>';
App.Modules.Security.Icons.PermissionNotSetButAllowedIcon =     '<svg xmlns="http://www.w3.org/2000/svg" width="2083" height="2083" viewBox="0 0 2083 2083"><path fill="#585858" d="M1357.13,174.069c45.29-1.109,69.25,16.113,98.23,31.043,45.82,23.611,88.82,48.952,130.98,75.512,18.1,11.4,40.69,22.956,53.73,39.433,12.66,16.006,22.26,35.607,27.7,58.731,8.02,34.046-5.47,61.417-12.59,86.418q-3.36,20.554-6.72,41.112c-13.73,79.87,25.66,164.183,55.42,206.4a306.766,306.766,0,0,0,126.77,103.2c22.97,10.05,49.94,12.1,75.56,21.814,36.57,13.857,66.43,44.391,78.09,83.062,8.88,29.463,8.18,70.494,9.23,104.04,2.47,78.89,6.04,172.23-28.54,217.3-33.16,43.22-88.82,45.01-141.05,67.96-56.17,24.68-102.22,70.87-132.66,121.66-26.17,43.67-53.11,115.83-40.3,189.62,7,40.29,28.56,77.91,17.63,124.17-19.1,80.9-116.06,116.78-180.51,154.38-28,16.34-59.8,35.95-93.19,45.3-45.2,12.67-89.17-9.04-112.5-27.68q-15.12-16.365-30.23-32.72c-49.24-39.63-95.89-63.71-173.79-77.19-16.06-2.78-37.65-4.63-55.41-1.68-75.523,12.54-125.6,32.7-173.794,70.48q-20.988,21.39-41.979,42.79c-25.2,19.9-77.4,39.78-120.9,22.65-62.6-24.66-119.546-61.5-173.792-95.65-38.262-24.08-71.8-44.32-86.477-92.29-14.573-47.64,7.531-92.07,15.113-135.92,12.455-72.03-18.614-151.05-43.658-191.3-30.922-49.68-76.892-93.75-132.654-118.3-49.838-21.93-103.856-23.07-136.011-63.76-34.163-43.23-36.951-137.73-31.9-218.14,2.184-34.81-.668-74.833,8.4-104.881C116.4,884.9,145.26,855.04,179.2,841.084c27.224-11.194,57.956-14.184,83.118-25.17,64.725-28.26,115.415-80.1,146.927-141.794,14.826-29.026,40.659-99.923,32.743-148.5q-2.519-23.07-5.037-46.146Q428.978,450.947,421,422.417c-10.576-53.769,20.754-98.288,48.7-118.3,57.992-41.537,122.2-80.761,190.585-110.75,30.447-13.352,62.62-26.3,104.947-12.585,39.056,12.653,54.107,42.218,82.278,64.6,43.6,34.643,134.034,85.888,221.654,71.316,69.63-11.581,118.47-28.769,163.71-62.926,25.34-19.124,41.83-47.3,69.69-63.765C1318.63,180.511,1337.6,181.963,1357.13,174.069ZM1030.25,355.011l-69,4.7c-58.36,10.71-113.436,19.651-163.1,39.178C599.5,476.987,458.828,618.45,380.981,817.311c-16.05,41-24.989,86.787-34.5,133.2-22.027,107.474-2.582,240.1,26.661,322.824,74.5,210.75,205.759,356.03,407.755,438.79,65.927,27.02,202.639,69.33,307.386,51.72,61.46-10.33,116.85-14.81,169.37-31.34,214.96-67.65,368.26-221.87,448.53-424.69,58.56-147.94,54.27-358.627-4.7-501.479C1599.45,559.183,1378.94,353.947,1030.25,355.011Z"/><path fill="#585858" d="M741.025,1091.9l149.831,290.05S1134.33,792.487,1518.27,596c-9.36,140.348-46.82,261.983,18.73,411.69-168.56,37.42-515.04,458.47-627.415,664.31C750.39,1475.51,563.1,1325.81,432,1279.03Z"/></svg>';
App.Modules.Security.Icons.PermissionNotSetButDeniedIcon =      '<svg xmlns="http://www.w3.org/2000/svg" width="2083" height="2083" viewBox="0 0 2083 2083"><path fill="#585858" d="M1357.13,174.069c45.29-1.109,69.25,16.113,98.23,31.043,45.82,23.611,88.82,48.952,130.98,75.512,18.1,11.4,40.69,22.956,53.73,39.433,12.66,16.006,22.26,35.607,27.7,58.731,8.02,34.046-5.47,61.417-12.59,86.418q-3.36,20.554-6.72,41.112c-13.73,79.87,25.66,164.183,55.42,206.4a306.766,306.766,0,0,0,126.77,103.2c22.97,10.05,49.94,12.1,75.56,21.814,36.57,13.857,66.43,44.391,78.09,83.062,8.88,29.463,8.18,70.494,9.23,104.04,2.47,78.89,6.04,172.23-28.54,217.3-33.16,43.22-88.82,45.01-141.05,67.96-56.17,24.68-102.22,70.87-132.66,121.66-26.17,43.67-53.11,115.83-40.3,189.62,7,40.29,28.56,77.91,17.63,124.17-19.1,80.9-116.06,116.78-180.51,154.38-28,16.34-59.8,35.95-93.19,45.3-45.2,12.67-89.17-9.04-112.5-27.68q-15.12-16.365-30.23-32.72c-49.24-39.63-95.89-63.71-173.79-77.19-16.06-2.78-37.65-4.63-55.41-1.68-75.523,12.54-125.6,32.7-173.794,70.48q-20.988,21.39-41.979,42.79c-25.2,19.9-77.4,39.78-120.9,22.65-62.6-24.66-119.546-61.5-173.792-95.65-38.262-24.08-71.8-44.32-86.477-92.29-14.573-47.64,7.531-92.07,15.113-135.92,12.455-72.03-18.614-151.05-43.658-191.3-30.922-49.68-76.892-93.75-132.654-118.3-49.838-21.93-103.856-23.07-136.011-63.76-34.163-43.23-36.951-137.73-31.9-218.14,2.184-34.81-.668-74.833,8.4-104.881C116.4,884.9,145.26,855.04,179.2,841.084c27.224-11.194,57.956-14.184,83.118-25.17,64.725-28.26,115.415-80.1,146.927-141.794,14.826-29.026,40.659-99.923,32.743-148.5q-2.519-23.07-5.037-46.146Q428.978,450.947,421,422.417c-10.576-53.769,20.754-98.288,48.7-118.3,57.992-41.537,122.2-80.761,190.585-110.75,30.447-13.352,62.62-26.3,104.947-12.585,39.056,12.653,54.107,42.218,82.278,64.6,43.6,34.643,134.034,85.888,221.654,71.316,69.63-11.581,118.47-28.769,163.71-62.926,25.34-19.124,41.83-47.3,69.69-63.765C1318.63,180.511,1337.6,181.963,1357.13,174.069ZM1030.25,355.011l-69,4.7c-58.36,10.71-113.436,19.651-163.1,39.178C599.5,476.987,458.828,618.45,380.981,817.311c-16.05,41-24.989,86.787-34.5,133.2-22.027,107.474-2.582,240.1,26.661,322.824,74.5,210.75,205.759,356.03,407.755,438.79,65.927,27.02,202.639,69.33,307.386,51.72,61.46-10.33,116.85-14.81,169.37-31.34,214.96-67.65,368.26-221.87,448.53-424.69,58.56-147.94,54.27-358.627-4.7-501.479C1599.45,559.183,1378.94,353.947,1030.25,355.011Z"/><path fill="#585858" d="M630.792,567.061L1530.94,1467.21l-89.1,89.09L541.7,656.156Z"/><path fill="#585858" d="M1445.38,564.232l89.09,89.1L634.328,1553.47l-89.1-89.09Z"/></svg>';
App.Modules.Security.Icons.PermissionAllowedIcon =              '<svg xmlns="http://www.w3.org/2000/svg" width="2083" height="2083" viewBox="0 0 2083 2083"><path fill="#585858" d="M1357.13,174.069c45.29-1.109,69.25,16.113,98.23,31.043,45.82,23.611,88.82,48.952,130.98,75.512,18.1,11.4,40.69,22.956,53.73,39.433,12.66,16.006,22.26,35.607,27.7,58.731,8.02,34.046-5.47,61.417-12.59,86.418q-3.36,20.554-6.72,41.112c-13.73,79.87,25.66,164.183,55.42,206.4a306.766,306.766,0,0,0,126.77,103.2c22.97,10.05,49.94,12.1,75.56,21.814,36.57,13.857,66.43,44.391,78.09,83.062,8.88,29.463,8.18,70.494,9.23,104.04,2.47,78.89,6.04,172.23-28.54,217.3-33.16,43.22-88.82,45.01-141.05,67.96-56.17,24.68-102.22,70.87-132.66,121.66-26.17,43.67-53.11,115.83-40.3,189.62,7,40.29,28.56,77.91,17.63,124.17-19.1,80.9-116.06,116.78-180.51,154.38-28,16.34-59.8,35.95-93.19,45.3-45.2,12.67-89.17-9.04-112.5-27.68q-15.12-16.365-30.23-32.72c-49.24-39.63-95.89-63.71-173.79-77.19-16.06-2.78-37.65-4.63-55.41-1.68-75.523,12.54-125.6,32.7-173.794,70.48q-20.988,21.39-41.979,42.79c-25.2,19.9-77.4,39.78-120.9,22.65-62.6-24.66-119.546-61.5-173.792-95.65-38.262-24.08-71.8-44.32-86.477-92.29-14.573-47.64,7.531-92.07,15.113-135.92,12.455-72.03-18.614-151.05-43.658-191.3-30.922-49.68-76.892-93.75-132.654-118.3-49.838-21.93-103.856-23.07-136.011-63.76-34.163-43.23-36.951-137.73-31.9-218.14,2.184-34.81-.668-74.833,8.4-104.881C116.4,884.9,145.26,855.04,179.2,841.084c27.224-11.194,57.956-14.184,83.118-25.17,64.725-28.26,115.415-80.1,146.927-141.794,14.826-29.026,40.659-99.923,32.743-148.5q-2.519-23.07-5.037-46.146Q428.978,450.947,421,422.417c-10.576-53.769,20.754-98.288,48.7-118.3,57.992-41.537,122.2-80.761,190.585-110.75,30.447-13.352,62.62-26.3,104.947-12.585,39.056,12.653,54.107,42.218,82.278,64.6,43.6,34.643,134.034,85.888,221.654,71.316,69.63-11.581,118.47-28.769,163.71-62.926,25.34-19.124,41.83-47.3,69.69-63.765C1318.63,180.511,1337.6,181.963,1357.13,174.069ZM1030.25,355.011l-69,4.7c-58.36,10.71-113.436,19.651-163.1,39.178C599.5,476.987,458.828,618.45,380.981,817.311c-16.05,41-24.989,86.787-34.5,133.2-22.027,107.474-2.582,240.1,26.661,322.824,74.5,210.75,205.759,356.03,407.755,438.79,65.927,27.02,202.639,69.33,307.386,51.72,61.46-10.33,116.85-14.81,169.37-31.34,214.96-67.65,368.26-221.87,448.53-424.69,58.56-147.94,54.27-358.627-4.7-501.479C1599.45,559.183,1378.94,353.947,1030.25,355.011Z"/><path fill="#286c15" d="M741.025,1091.9l149.831,290.05S1134.33,792.487,1518.27,596c-9.36,140.348-46.82,261.983,18.73,411.69-168.56,37.42-515.04,458.47-627.415,664.31C750.39,1475.51,563.1,1325.81,432,1279.03Z"/></svg>';
App.Modules.Security.Icons.PermissionDeniedIcon =               '<svg xmlns="http://www.w3.org/2000/svg" width="2083" height="2083" viewBox="0 0 2083 2083"><path fill="#585858" d="M1357.13,174.069c45.29-1.109,69.25,16.113,98.23,31.043,45.82,23.611,88.82,48.952,130.98,75.512,18.1,11.4,40.69,22.956,53.73,39.433,12.66,16.006,22.26,35.607,27.7,58.731,8.02,34.046-5.47,61.417-12.59,86.418q-3.36,20.554-6.72,41.112c-13.73,79.87,25.66,164.183,55.42,206.4a306.766,306.766,0,0,0,126.77,103.2c22.97,10.05,49.94,12.1,75.56,21.814,36.57,13.857,66.43,44.391,78.09,83.062,8.88,29.463,8.18,70.494,9.23,104.04,2.47,78.89,6.04,172.23-28.54,217.3-33.16,43.22-88.82,45.01-141.05,67.96-56.17,24.68-102.22,70.87-132.66,121.66-26.17,43.67-53.11,115.83-40.3,189.62,7,40.29,28.56,77.91,17.63,124.17-19.1,80.9-116.06,116.78-180.51,154.38-28,16.34-59.8,35.95-93.19,45.3-45.2,12.67-89.17-9.04-112.5-27.68q-15.12-16.365-30.23-32.72c-49.24-39.63-95.89-63.71-173.79-77.19-16.06-2.78-37.65-4.63-55.41-1.68-75.523,12.54-125.6,32.7-173.794,70.48q-20.988,21.39-41.979,42.79c-25.2,19.9-77.4,39.78-120.9,22.65-62.6-24.66-119.546-61.5-173.792-95.65-38.262-24.08-71.8-44.32-86.477-92.29-14.573-47.64,7.531-92.07,15.113-135.92,12.455-72.03-18.614-151.05-43.658-191.3-30.922-49.68-76.892-93.75-132.654-118.3-49.838-21.93-103.856-23.07-136.011-63.76-34.163-43.23-36.951-137.73-31.9-218.14,2.184-34.81-.668-74.833,8.4-104.881C116.4,884.9,145.26,855.04,179.2,841.084c27.224-11.194,57.956-14.184,83.118-25.17,64.725-28.26,115.415-80.1,146.927-141.794,14.826-29.026,40.659-99.923,32.743-148.5q-2.519-23.07-5.037-46.146Q428.978,450.947,421,422.417c-10.576-53.769,20.754-98.288,48.7-118.3,57.992-41.537,122.2-80.761,190.585-110.75,30.447-13.352,62.62-26.3,104.947-12.585,39.056,12.653,54.107,42.218,82.278,64.6,43.6,34.643,134.034,85.888,221.654,71.316,69.63-11.581,118.47-28.769,163.71-62.926,25.34-19.124,41.83-47.3,69.69-63.765C1318.63,180.511,1337.6,181.963,1357.13,174.069ZM1030.25,355.011l-69,4.7c-58.36,10.71-113.436,19.651-163.1,39.178C599.5,476.987,458.828,618.45,380.981,817.311c-16.05,41-24.989,86.787-34.5,133.2-22.027,107.474-2.582,240.1,26.661,322.824,74.5,210.75,205.759,356.03,407.755,438.79,65.927,27.02,202.639,69.33,307.386,51.72,61.46-10.33,116.85-14.81,169.37-31.34,214.96-67.65,368.26-221.87,448.53-424.69,58.56-147.94,54.27-358.627-4.7-501.479C1599.45,559.183,1378.94,353.947,1030.25,355.011Z"/><path fill="red" d="M630.792,567.061L1530.94,1467.21l-89.1,89.09L541.7,656.156Z"/><path fill="red" d="M1445.38,564.232l89.09,89.1L634.328,1553.47l-89.1-89.09Z"/></svg>';

App.Modules.Security.Icons.ContextMenuPermissionDenyIcon =      '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><path fill="white" d="M3.158,13.409a3.232,3.232,0,0,0-1.4-1.266,3.26,3.26,0,0,1-1.434-.683A4.026,4.026,0,0,1-.011,9.125,5.549,5.549,0,0,1,.077,8,1.379,1.379,0,0,1,.856,7.141c0.287-.12.611-0.152,0.876-0.269A3.225,3.225,0,0,0,3.282,5.353a3.2,3.2,0,0,0,.345-1.59L3.574,3.27,3.406,2.659a1.3,1.3,0,0,1,.513-1.266A11.219,11.219,0,0,1,5.928.207,1.42,1.42,0,0,1,7.035.073,2.709,2.709,0,0,1,7.9.764a3.224,3.224,0,0,0,2.337.763A3.639,3.639,0,0,0,11.965.854,8.609,8.609,0,0,1,12.7.171,4.476,4.476,0,0,1,13.275,0a1.855,1.855,0,0,1,1.036.332c0.483,0.253.936,0.524,1.381,0.808a2.217,2.217,0,0,1,.566.422,1.6,1.6,0,0,1,.292.629,1.722,1.722,0,0,1-.133.925l-0.071.44a3.289,3.289,0,0,0,1.921,3.314c0.242,0.108.527,0.13,0.8,0.233C3.168,13.409,19.078,7.121,3.158,13.409ZM16,9c-0.91-3.343-3.626-4.007-6.1-4l-0.489.033a6.277,6.277,0,0,0-1.155.277A5.05,5.05,0,0,0,5.306,8.272a5.814,5.814,0,0,0-.244.943C4.906,9.975,4.887,10.04,5,13,14.4,9.773,6.668,12.292,16,9Z"/><path fill="white" d="M6.032,15.984l8.951-8.951,2.984,2.984L9.016,18.968Z"/><path fill="white" d="M6.032,10.016L9.016,7.032l8.952,8.951-2.984,2.984Z"/></svg>';
App.Modules.Security.Icons.ContextMenuPermissionAllowIcon =     '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><path fill="white" d="M3.158,13.409a3.232,3.232,0,0,0-1.4-1.266,3.26,3.26,0,0,1-1.434-.683A4.026,4.026,0,0,1-.011,9.125,5.549,5.549,0,0,1,.077,8,1.379,1.379,0,0,1,.856,7.141c0.287-.12.611-0.152,0.876-0.269A3.225,3.225,0,0,0,3.282,5.353a3.2,3.2,0,0,0,.345-1.59L3.574,3.27,3.406,2.659a1.3,1.3,0,0,1,.513-1.266A11.219,11.219,0,0,1,5.928.207,1.42,1.42,0,0,1,7.035.073,2.709,2.709,0,0,1,7.9.764a3.224,3.224,0,0,0,2.337.763A3.639,3.639,0,0,0,11.965.854,8.609,8.609,0,0,1,12.7.171,4.476,4.476,0,0,1,13.275,0a1.855,1.855,0,0,1,1.036.332c0.483,0.253.936,0.524,1.381,0.808a2.217,2.217,0,0,1,.566.422,1.6,1.6,0,0,1,.292.629,1.722,1.722,0,0,1-.133.925l-0.071.44a3.289,3.289,0,0,0,1.921,3.314c0.242,0.108.527,0.13,0.8,0.233C3.168,13.409,19.078,7.121,3.158,13.409ZM16,8c-0.91-3.343-3.626-3.007-6.1-3l-0.489.033a6.277,6.277,0,0,0-1.155.277A5.05,5.05,0,0,0,5.306,8.272a5.814,5.814,0,0,0-.244.943C4.906,9.975,4.887,10.04,5,13,14.4,9.773,6.668,11.292,16,8Z"/><path fill="white" d="M8.915,10.452l1.9,3.774S13.9,6.557,18.763,4C18.644,5.826,18.17,7.409,19,9.357c-2.136.487-6.525,5.965-7.949,8.643C9.034,15.444,6.661,13.5,5,12.887Z"/></svg>';

const Security = new App.Modules.Security();
