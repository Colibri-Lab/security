App.Modules.Security.AdministratePage = class extends Colibri.UI.Component 
{

    constructor(name, container) {
        super(name, container, Colibri.UI.Templates['App.Modules.Security.AdministratePage']);

        this.AddClass('app-security-administrate-page-component');

        this._userAndRolesTree = this.Children('split/userroles-pane/userroles');
        this._permissionsTree = this.Children('split/permissions-pane/permissions');

        this._permissionsTree.user = null;
        this._userAndRolesTree.AddHandler('SelectionChanged', (event, args) => this.__userAndRolesTreeSelectionChanged(event, args));

        this._permissionsTree.AddHandler('ContextMenuIconClicked', (event, args) => this.__renderPermissionsTreeContextMenu(event, args))
        this._permissionsTree.AddHandler('ContextMenuItemClicked', (event, args) => this.__clickOnPermissionsContextMenu(event, args));  
        
        this._userAndRolesTree.AddHandler('ContextMenuIconClicked', (event, args) => this.__renderUserAndRolesTreeContextMenu(event, args))
        this._userAndRolesTree.AddHandler('ContextMenuItemClicked', (event, args) => this.__clickOnUserAndRolesContextMenu(event, args));  

    }

    __userAndRolesTreeSelectionChanged(event, args) {
        this._permissionsTree.user = this._userAndRolesTree.selected?.tag;
    }

    __renderPermissionsTreeContextMenu(event, args) {

        if(!this._userAndRolesTree.selected) {
            return;
        }

        let contextmenu = [];
        
        const perm = args.item.tag;
        const userOrRole = this._userAndRolesTree.selected.tag;

        const commandSet = Security.IsCommandSet(perm.name == 'app' ? '*' : perm.name, userOrRole);
        const commandSetChilds = Security.IsCommandSet(perm.name == 'app' ? '*' : perm.name + '.*', userOrRole);
        const access = Security.IsCommandAllowed(perm.name, userOrRole);
        const hasChilds = !args.item.tag.isLeaf;


        if(perm.name == 'app') {

            // главный узел
            // нету setChilds isroot=1 haschilds=1
            
            if(commandSet) {
                contextmenu.push({name: 'unset', title: 'Очистить везде', icon: Colibri.UI.ContextMenuRemoveIcon});
            }
            if(access) {
                contextmenu.push({name: 'deny', title: 'Запретить везде', icon: App.Modules.Security.Icons.ContextMenuPermissionDenyIcon});
            }
            else {
                contextmenu.push({name: 'allow', title: 'Разрешить везде', icon: App.Modules.Security.Icons.ContextMenuPermissionAllowIcon});
            }

        }
        else {
            
            if(commandSet) {
                contextmenu.push({name: 'unset', title: 'Очистить (' + perm.name + ': ' + (commandSet) + ')', icon: Colibri.UI.ContextMenuRemoveIcon});
            }
            if(commandSetChilds) {
                contextmenu.push({name: 'unset-all', title: 'Очистить все (' + perm.name + ': ' + (commandSetChilds) + ')', icon: Colibri.UI.ContextMenuRemoveIcon});
            }
            
            var allows = [];
            var denies = [];
            if(commandSet) {
                if(commandSet == 'deny') {
                    allows.push({name: 'allow', title: 'Разрешить (' + perm.name + ': allow)', icon: App.Modules.Security.Icons.ContextMenuPermissionAllowIcon});
                }
                else if(commandSet == 'allow') {
                    denies.push({name: 'deny', title: 'Запретить (' + perm.name + ': deny)', icon: App.Modules.Security.Icons.ContextMenuPermissionDenyIcon});
                }
            }
            else {
                allows.push({name: 'allow', title: 'Разрешить (' + perm.name + ': allow)', icon: App.Modules.Security.Icons.ContextMenuPermissionAllowIcon});
                denies.push({name: 'deny', title: 'Запретить (' + perm.name + ': deny)', icon: App.Modules.Security.Icons.ContextMenuPermissionDenyIcon});
            }
            
            if(hasChilds) {
                if(commandSetChilds) {
                    if(commandSetChilds == 'deny') {
                        allows.push({name: 'allow-all', title: 'Разрешить все (' + perm.name + '.*: allow)', icon: App.Modules.Security.Icons.ContextMenuPermissionAllowIcon});
                    }
                    else if (setChilds == 'allow') {
                        denies.push({name: 'deny-all', title: 'Запретить все (' + perm.name + '.*: deny)', icon: App.Modules.Security.Icons.ContextMenuPermissionDenyIcon});
                    }
                }
                else {
                    allows.push({name: 'allow-all', title: 'Разрешить все (' + perm.name + '.*: allow)', icon: App.Modules.Security.Icons.ContextMenuPermissionAllowIcon});
                    denies.push({name: 'deny-all', title: 'Запретить все (' + perm.name + '.*: deny)', icon: App.Modules.Security.Icons.ContextMenuPermissionDenyIcon});
                }
            }
            
            contextmenu = contextmenu.concat(allows);
            contextmenu = contextmenu.concat(denies);
        }
        args.item.contextmenu = contextmenu;
        args.item.ShowContextMenu(args.isContextMenuEvent ? 'right bottom' : 'left bottom', '', args.isContextMenuEvent ? {left: args.domEvent.clientX, top: args.domEvent.clientY} : null);


    }

    __clickOnPermissionsContextMenu(event, args) {

        const item = args?.item;
        const menuData = args.menuData;
        if(!menuData || !item) {
            return false;
        }

        let permission = item.tag;
        const userOrRole = this._userAndRolesTree.selected.tag;

        switch(menuData.name) {
            case 'unset': {
                userOrRole.permissions = Security.RemovePermission(userOrRole.permissions, permission.name);
                break;                                
            }
            case 'unset-all': {
                permission.name += '.*';
                userOrRole.permissions = Security.RemovePermission(userOrRole.permissions, permission.name);
                break;                                
            }
            case 'allow': {
                userOrRole.permissions = Security.AddPermission(userOrRole.permissions, permission.name, 'allow');
                break;                                
            }
            case 'allow-all': {
                permission.name += '.*';
                userOrRole.permissions = Security.AddPermission(userOrRole.permissions, permission.name, 'allow');
                break;
            }
            case 'deny': {
                userOrRole.permissions = Security.AddPermission(userOrRole.permissions, permission.name, 'deny');
                break;
            }
            case 'deny-all': {
                permission.name += '.*';
                userOrRole.permissions = Security.AddPermission(userOrRole.permissions, permission.name, 'deny');
                break;
            }
        }

        if(userOrRole.role !== undefined) {
            // это пользователь
            Security.SaveUser(userOrRole);
        }
        else {
            Security.SaveRole(userOrRole);
        }
        this._userAndRolesTree.selected.tag = userOrRole;
        this._permissionsTree.user = this._userAndRolesTree.selected?.tag;

    }

    __renderUserAndRolesTreeContextMenu(event, args) {
        let contextmenu = [];
        const item = args.item;
        const itemData = item?.tag;

        if(!itemData) {
            contextmenu.push({name: 'add-role', title: 'Добавить роль', icon: Colibri.UI.ContextMenuAddIcon});
            contextmenu.push({name: 'add-user', title: 'Добавить пользователя', icon: Colibri.UI.ContextMenuAddIcon});
            this._userAndRolesTree.contextmenu = contextmenu;
            this._userAndRolesTree.ShowContextMenu(args.isContextMenuEvent ? 'right bottom' : 'left bottom', '', args.isContextMenuEvent ? {left: args.domEvent.clientX, top: args.domEvent.clientY} : null);
        }
        else {
            if(itemData.role === undefined) {
                // это роле
                contextmenu.push({name: 'edit-role', title: 'Редактировать', icon: Colibri.UI.ContextMenuEditIcon});
                contextmenu.push({name: 'delete-role', title: 'Удалить', icon: Colibri.UI.ContextMenuRemoveIcon});
            }
            else {
                contextmenu.push({name: 'edit-user', title: 'Редактировать', icon: Colibri.UI.ContextMenuEditIcon});
                contextmenu.push({name: 'delete-user', title: 'Удалить', icon: Colibri.UI.ContextMenuRemoveIcon});
            }

            item.contextmenu = contextmenu;
            item.ShowContextMenu(args.isContextMenuEvent ? 'right bottom' : 'left bottom', '', args.isContextMenuEvent ? {left: args.domEvent.clientX, top: args.domEvent.clientY} : null);

        }

    }

    __clickOnUserAndRolesContextMenu(event, args) {

        const item = args?.item;
        const menuData = args.menuData;
        if(!menuData || !item) {
            return false;
        }

        switch(menuData.name) {
            case 'add-user': {
                Manage.FormWindow.Show('Добавить пользователя', 800, 'app.manage.storages(users)', {})
                    .then((data) => {
                        Security.SaveUser(data);
                    })
                    .catch(() => {});
                break;                                
            }
            case 'add-role': {
                Manage.FormWindow.Show('Добавить пользователя', 800, 'app.manage.storages(roles)', {})
                    .then((data) => {
                        Security.SaveRole(data);
                    })
                    .catch(() => {});
                break;                                
            }
            case 'edit-role': {
                Manage.FormWindow.Show('Редактировать роль', 800, 'app.manage.storages(roles)', item.tag)
                    .then((data) => {
                        Security.SaveRole(data);
                    })
                    .catch(() => {});

                break;                                
            }
            case 'delete-role': {
                App.Confirm.Show('Удаление роли', 'Вы уверены, что хотите удалить роль? Пользователи будут перемещены в роль Readonly').then(() => {
                    Security.RemoveRole(item.tag.id);
                });
                break;                                
            }
            case 'edit-user': {
                Manage.FormWindow.Show('Редактировать роль', 800, 'app.manage.storages(users)', item.tag)
                    .then((data) => {
                        Security.SaveUser(data);
                    })
                    .catch(() => {});
                break;                                
            }
            case 'delete-user': {
                const current = Security.Store.Query('security.user');
                if(current.id == item.tag.id) {
                    App.Notices.Add(new Colibri.UI.Notice('Вы не можете удалить самого себя!'));
                }
                else {
                    App.Confirm.Show('Удаление пользователя', 'Вы уверены, что хотите удалить роль? Пользователи будут перемещены в роль Readonly').then(() => {
                        Security.RemoveRole(item.tag.id);
                    });    
                }
                break;                                
            }
        }

    }

}