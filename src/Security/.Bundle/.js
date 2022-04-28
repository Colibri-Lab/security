

App.Modules.Security = class extends Colibri.Modules.Module {

    /** @constructor */
    constructor() {
        super('Security');
    }

    

    InitializeModule() {

        this.userData = {};

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


    }

    Render(container) {
        console.log('Rendering Module Security');
        

    }

    RegisterEvents() {
        console.log('Registering module events for Security');
        

    }

    RegisterEventHandlers() {
        console.log('Registering event handlers for Security');


    }

    ShowProfileWindow() {
        if(this.IsCommandAllowed('security.profile')) {
            Manage.FormWindow.Show('Личный кабинет', 800, 'app.manage.storages(users)', this._store.Query('security.user'))
                .then((data) => {
                    this.SaveUser(data);
                })
                .catch(() => {});
        }
        else {
            App.Notices.Add(new Colibri.UI.Notice('#{security-global-notallowed;Действие запрещено}', Colibri.UI.Notice.Error, 5000));
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
                App.Notices.Add(new Colibri.UI.Notice('#{security-login-success-message;Вы успешно вошли в систему, пожалуйста, подождите пока мы произведем запуск!}', Colibri.UI.Notice.Success, 3000));
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
                App.Notices.Add(new Colibri.UI.Notice('#{security-logout-success-message;До свидания!}', Colibri.UI.Notice.Success, 3000));
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
                App.Notices.Add(new Colibri.UI.Notice('#{security-register-success-message;Вы успешно зарегистрировались, пожалуйста, проверьте почтовый ящик}', Colibri.UI.Notice.Success, 3000));
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
                if(!Array.isArray(users)) {
                    users = [];
                }

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

                App.Notices.Add(new Colibri.UI.Notice('#{app-messages-datasaved;Данные успешно сохранены}', Colibri.UI.Notice.Success, 3000));
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
                App.Notices.Add(new Colibri.UI.Notice('#{app-messages-datasaved;Данные успешно сохранены}', Colibri.UI.Notice.Success, 3000));
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
                App.Notices.Add(new Colibri.UI.Notice('#{app-messages-dataremoved;Данные успешно удалены}', Colibri.UI.Notice.Success, 3000));
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
                if(!Array.isArray(users)) {
                    users = [];
                }

                let newUsers = [];
                users.map((u) => {
                    if(u.id != value.id) {
                        newUsers.push(u);
                    }
                });

                this._store.Set('security.users', newUsers);
                App.Notices.Add(new Colibri.UI.Notice('#{app-messages-dataremoved;Данные успешно удалены}', Colibri.UI.Notice.Success, 3000));
            })
            .catch(error => {
                App.Notices.Add(new Colibri.UI.Notice(error.result));
                console.error(error);
            });
    }

    ResetRequest(value) {
        this.Call('Client', 'ResetRequest', value)
            .then((response) => {
                App.Notices.Add(new Colibri.UI.Notice('#{security-reset-message;Запрос на восстановление успешно отправлен вам на почту, пожалуйста, перейдите по ссылке в письме!}', Colibri.UI.Notice.Success, 3000));
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

App.Modules.Security.Icons.RoleIcon =                           '<svg xmlns="http://www.w3.org/2000/svg" width="2083" height="2083" viewBox="0 0 2083 2083"><path fill="#585858" d="M982.915,133.056c78.025-1.192,132.575,14.869,184.925,37.957,116.42,51.336,163.38,128.9,199.67,259.893,8.11,29.264,10.85,60.617,16.53,92.883q1.785,20.986,3.57,41.976,0.45,21.879.9,43.762c0,4.4-1.39,14.383.89,16.969,15.41,16.082,21.24,23.518,27.7,49.121,3.84,15.239,2.16,38.782-.9,53.14-8.17,38.418-18.9,65.9-45.56,85.292-6.52,4.745-14.29,10.4-23.67,12.056-0.78,5.741-8.19,35.084-11.17,37.064l-55.84,17.416c-36.66,14.313-71.64,29.989-103.63,49.121C1058.42,1000.24,969.883,1101.1,913.678,1233.36c-10.857,25.55-17.912,52.02-26.354,80.38-24.455,82.15-27.641,209.02-5.361,296.51,16.92,66.44,40.523,121.76,69.237,175.05-0.149.45-.3,0.89-0.447,1.34l-101.845-4.02q-23.672-1.335-47.349-2.68-31.264-2.235-62.536-4.46-39.975-3.585-79.957-7.15c-35.758-6.02-71.909-5.7-106.312-12.06-47.532-8.78-95.213-11.06-140.707-20.54-44.782-9.33-89.458-14.4-129.987-26.79-15.831-4.84-35.177-8.44-44.222-20.09-16.822-21.69-17.62-56.21-23.228-89.32-1.776-10.48-3.8-26.24-1.786-38.85,13.895-87.25,11.941-134.39,72.81-177.28,21.487-15.14,46.546-26.84,72.81-37.06q25.681-8.49,51.369-16.97c58.869-22.81,120.771-41.62,181.8-60.73,18.184-5.7,36.258-9.37,53.156-16.08,51.838-20.58,117.844-58.53,138.473-109.4,4.707-11.61,9.644-30.68,7.147-46.44q-0.224-12.735-.447-25.46c-2.974-18.74-2.709-35.54-8.933-50.01-10.67-24.811-35.392-44.021-55.39-59.839-7.107-5.622-15.385-11.23-20.994-18.309-18.528-23.38-28.251-54.941-38.862-86.184q-4.913-15.4-9.827-30.813c-46.039-8.009-81.98-88.307-67-147.808,3.549-14.1,8.4-27.737,15.187-38.851l10.72-14.736q-0.222-18.083-.446-36.171,2.233-35.274,4.467-70.555c9.545-55.323,15.474-107.194,33.5-153.614C689.6,268.5,751.186,201.242,844.441,161.635c25.409-10.791,53.091-17.321,83.531-23.221ZM1655.63,1012.32c24.1-.59,36.84,8.57,52.26,16.52,24.38,12.57,47.25,26.05,69.68,40.19,9.64,6.07,21.66,12.22,28.59,20.99a78.93,78.93,0,0,1,14.74,31.26c4.27,18.12-2.91,32.69-6.7,45.99q-1.785,10.935-3.57,21.88c-7.31,42.51,13.65,87.39,29.48,109.85a163.259,163.259,0,0,0,67.45,54.93c12.22,5.35,26.57,6.44,40.2,11.61a69.1,69.1,0,0,1,41.54,44.21c4.73,15.68,4.36,37.52,4.92,55.37,1.31,41.99,3.21,91.67-15.19,115.66-17.64,23-47.25,23.95-75.04,36.17-29.89,13.14-54.39,37.72-70.58,64.75-13.92,23.24-28.26,61.65-21.44,100.92,3.72,21.45,15.19,41.47,9.38,66.09-10.17,43.06-61.75,62.15-96.04,82.17-14.9,8.69-31.82,19.13-49.58,24.11-24.05,6.74-47.44-4.82-59.86-14.74q-8.04-8.7-16.08-17.41c-26.2-21.09-51.02-33.91-92.46-41.08-8.55-1.48-20.03-2.47-29.48-.9-40.18,6.68-66.83,17.41-92.47,37.51l-22.33,22.78c-13.41,10.59-41.18,21.17-64.33,12.05-33.3-13.12-63.6-32.73-92.46-50.9-20.36-12.82-38.2-23.59-46.01-49.12-7.75-25.36,4.01-49.01,8.04-72.35,6.63-38.33-9.9-80.39-23.23-101.81-16.45-26.44-40.91-49.9-70.57-62.96-26.52-11.68-55.26-12.28-72.37-33.94-18.173-23.01-19.656-73.31-16.972-116.1,1.162-18.53-.355-39.83,4.467-55.82,5.895-19.55,21.255-35.44,39.305-42.87,14.49-5.96,30.84-7.55,44.23-13.4,34.43-15.04,61.4-42.63,78.17-75.47,7.88-15.45,21.63-53.18,17.42-79.04q-1.35-12.27-2.68-24.56l-8.49-30.36c-5.63-28.62,11.04-52.31,25.91-62.97,30.85-22.1,65.01-42.98,101.4-58.94,16.2-7.11,33.31-14,55.83-6.7,20.78,6.73,28.79,22.47,43.78,34.38,23.19,18.44,71.31,45.72,117.92,37.96,37.05-6.16,63.03-15.31,87.11-33.49,13.48-10.18,22.25-25.17,37.07-33.94C1635.14,1015.75,1645.24,1016.52,1655.63,1012.32Zm-170.64,271.06q-9.825.66-19.65,1.34c-16.62,3.05-32.31,5.59-46.46,11.16-56.57,22.25-96.64,62.56-118.82,119.23-4.57,11.68-7.11,24.73-9.82,37.96-6.28,30.62-.74,68.41,7.59,91.99,21.22,60.05,58.61,101.44,116.14,125.03,18.78,7.7,57.72,19.75,87.55,14.74,17.51-2.95,33.28-4.23,48.24-8.93,61.23-19.28,104.89-63.23,127.76-121.02,16.67-42.16,15.45-102.19-1.34-142.9C1647.12,1341.55,1584.31,1283.07,1484.99,1283.38Z"/></svg>';
App.Modules.Security.Icons.UserIcon =                           '<svg xmlns="http://www.w3.org/2000/svg" width="2083" height="2083" viewBox="0 0 2083 2083"><path fill="#585858" d="M1999,1957H77.044c-1.868-85.92,47.737-144.88,85.65-192.57,35.873-45.13,82.67-83.98,129.888-117.71a1707.942,1707.942,0,0,1,318.6-179.87,1362.283,1362.283,0,0,1,140.711-51.32c21.563-6.6,55.306-7,67.768-23.07,17.154-22.12,20.513-54.71,26.354-88.52q1.176-18.12,2.353-36.25-11.058-12.015-22.119-24.02-18.822-24-37.648-48.02c-51.12-71.6-89.08-149.35-110.122-251.9-22.791.046-38.2-13.015-48.473-25.9-28.324-35.533-56.379-106.227-39.53-173.741,5.177-20.748,12.745-38.989,24-53.676l13.648-14.125q-3.53-35.074-7.059-70.156-1.412-23.3-2.824-46.613V495.977q2.118-24.481,4.236-48.967c4.056-23.024,5.484-44.032,10.824-64.977,20.759-81.432,57.885-149.2,115.3-193.987,44.107-34.409,95.176-57.161,159.065-72.509,22.8-5.477,47.241-6.248,72-10.359l33.413-1.883c14.32-2.34,48.03-1.194,61.18.941l41.41,2.826c34.02,5.976,65.9,11.015,95.06,20.246C1346.88,170.4,1415.35,260.817,1447.45,408.4c4.62,21.221,5.13,44.947,8.94,68.273q0.465,15.065.94,30.133v55.56q-1.41,22.362-2.82,44.73-3.525,34.839-7.06,69.684c62.65,46.44,45.52,177.2,4.71,233.067-11.7,16.015-27.78,33.952-55.07,33.9-3.29,27.353-11.15,53.5-19.29,76.752-26.38,75.28-61.97,137.23-105.42,194.92-13.75,18.26-30.94,33.86-44.7,51.8-0.51,45.75,9.35,111.99,34.35,131.36,8.57,6.64,22.02,6.76,34.35,9.89q21.66,5.88,43.3,11.77c53.1,16.74,103.27,36.98,152.01,58.38,103.1,45.29,198.11,101.01,284.71,162.92,51.01,36.45,101.06,77.41,139.77,126.18C1955.05,1816.7,1999.04,1870.22,1999,1957Z"/></svg>';
App.Modules.Security.Icons.UserAndRolesIcon =                   '<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 4C11.243 4 9 6.243 9 9C9 11.757 11.243 14 14 14C16.757 14 19 11.757 19 9C19 6.243 16.757 4 14 4ZM14 12C12.346 12 11 10.654 11 9C11 7.346 12.346 6 14 6C15.654 6 17 7.346 17 9C17 10.654 15.654 12 14 12ZM23 23V22C23 18.141 19.859 15 16 15H12C8.14 15 5 18.141 5 22V23H7V22C7 19.243 9.243 17 12 17H16C18.757 17 21 19.243 21 22V23H23Z" fill="#2E3A59"/></svg>';

const Security = new App.Modules.Security();
