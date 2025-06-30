App.Modules.Security.AdministratePage = class extends Colibri.UI.Component 
{

    constructor(name, container) {
        super(name, container, Colibri.UI.Templates['App.Modules.Security.AdministratePage']);

        this.AddClass('app-security-administrate-page-component');

        this._userAndRolesTree = this.Children('split/userroles-pane/userroles');
        this._permissionsTree = this.Children('split/permissions-pane/permissions');

        this._permissionsTree.user = null;
        this._userAndRolesTree.AddHandler('SelectionChanged', this.__userAndRolesTreeSelectionChanged, false, this);

        this._permissionsTree.AddHandler('ContextMenuIconClicked', (event, args) => this.__renderPermissionsTreeContextMenu(event, args))
        this._permissionsTree.AddHandler('ContextMenuItemClicked', this.__clickOnPermissionsContextMenu, false, this);  
        
        this._userAndRolesTree.AddHandler('ContextMenuIconClicked', (event, args) => this.__renderUserAndRolesTreeContextMenu(event, args))
        this._userAndRolesTree.AddHandler('ContextMenuItemClicked', this.__clickOnUserAndRolesContextMenu, false, this);  

    }

    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */ 
    __userAndRolesTreeSelectionChanged(event, args) {
        this._permissionsTree.user = this._userAndRolesTree.selected?.tag;
    }

    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */ 
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
                contextmenu.push({name: 'unset', title: '#{security-permissions-cleareverywere}', icon: Colibri.UI.ContextMenuRemoveIcon});
            }
            if(access) {
                contextmenu.push({name: 'deny', title: '#{security-permissions-denyeveryware}', icon: App.Modules.Security.Icons.ContextMenuPermissionDenyIcon});
            }
            else {
                contextmenu.push({name: 'allow', title: '#{security-permissions-alloweveryware}', icon: App.Modules.Security.Icons.ContextMenuPermissionAllowIcon});
            }

        }
        else {
            
            if(commandSet) {
                contextmenu.push({name: 'unset', title: '#{security-permissions-clear} (' + perm.name + ': ' + (commandSet) + ')', icon: Colibri.UI.ContextMenuRemoveIcon});
            }
            if(commandSetChilds) {
                contextmenu.push({name: 'unset-all', title: '#{security-permissions-clearall} (' + perm.name + ': ' + (commandSetChilds) + ')', icon: Colibri.UI.ContextMenuRemoveIcon});
            }
            
            var allows = [];
            var denies = [];
            if(commandSet) {
                if(commandSet == 'deny') {
                    allows.push({name: 'allow', title: '#{security-permissions-allow} (' + perm.name + ': allow)', icon: App.Modules.Security.Icons.ContextMenuPermissionAllowIcon});
                }
                else if(commandSet == 'allow') {
                    denies.push({name: 'deny', title: '#{security-permissions-deny} (' + perm.name + ': deny)', icon: App.Modules.Security.Icons.ContextMenuPermissionDenyIcon});
                }
            }
            else {
                allows.push({name: 'allow', title: '#{security-permissions-allow} (' + perm.name + ': allow)', icon: App.Modules.Security.Icons.ContextMenuPermissionAllowIcon});
                denies.push({name: 'deny', title: '#{security-permissions-deny} (' + perm.name + ': deny)', icon: App.Modules.Security.Icons.ContextMenuPermissionDenyIcon});
            }
            
            if(hasChilds) {
                if(commandSetChilds) {
                    if(commandSetChilds == 'deny') {
                        allows.push({name: 'allow-all', title: '#{security-permissions-allowall} (' + perm.name + '.*: allow)', icon: App.Modules.Security.Icons.ContextMenuPermissionAllowIcon});
                    }
                    else if (setChilds == 'allow') {
                        denies.push({name: 'deny-all', title: '#{security-permissions-denyall} (' + perm.name + '.*: deny)', icon: App.Modules.Security.Icons.ContextMenuPermissionDenyIcon});
                    }
                }
                else {
                    allows.push({name: 'allow-all', title: '#{security-permissions-allowall} (' + perm.name + '.*: allow)', icon: App.Modules.Security.Icons.ContextMenuPermissionAllowIcon});
                    denies.push({name: 'deny-all', title: '#{security-permissions-denyall} (' + perm.name + '.*: deny)', icon: App.Modules.Security.Icons.ContextMenuPermissionDenyIcon});
                }
            }
            
            contextmenu = contextmenu.concat(allows);
            contextmenu = contextmenu.concat(denies);
        }
        args.item.contextmenu = contextmenu;
        args.item.ShowContextMenu(args.isContextMenuEvent ? [Colibri.UI.ContextMenu.LB, Colibri.UI.ContextMenu.LT] : [Colibri.UI.ContextMenu.RB, Colibri.UI.ContextMenu.RT], '', args.isContextMenuEvent ? {left: args.domEvent.clientX, top: args.domEvent.clientY} : null);


    }

    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */ 
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

    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */ 
    __renderUserAndRolesTreeContextMenu(event, args) {
        let contextmenu = [];
        const item = args.item;
        const itemData = item?.tag;

        if(!itemData) {
            contextmenu.push({name: 'add-role', title: '#{security-contextmenu-addrole}', icon: Colibri.UI.ContextMenuAddIcon});
            contextmenu.push({name: 'add-user', title: '#{security-contextmenu-adduser}', icon: Colibri.UI.ContextMenuAddIcon});
            this._userAndRolesTree.contextmenu = contextmenu;
            this._userAndRolesTree.ShowContextMenu(args.isContextMenuEvent ? [Colibri.UI.ContextMenu.RB, Colibri.UI.ContextMenu.RB] : [Colibri.UI.ContextMenu.RT, Colibri.UI.ContextMenu.LT], '', args.isContextMenuEvent ? {left: args.domEvent.clientX, top: args.domEvent.clientY} : null);
        }
        else {
            if(itemData.role === undefined) {
                // это роле
                contextmenu.push({name: 'edit-role', title: '#{security-contextmenu-edit}', icon: Colibri.UI.ContextMenuEditIcon});
                contextmenu.push({name: 'delete-role', title: '#{security-contextmenu-remove}', icon: Colibri.UI.ContextMenuRemoveIcon});
            }
            else {
                contextmenu.push({name: 'edit-user', title: '#{security-contextmenu-edit}', icon: Colibri.UI.ContextMenuEditIcon});
                contextmenu.push({name: 'delete-user', title: '#{security-contextmenu-remove}', icon: Colibri.UI.ContextMenuRemoveIcon});
            }

            item.contextmenu = contextmenu;
            item.ShowContextMenu(args.isContextMenuEvent ? [Colibri.UI.ContextMenu.LB, Colibri.UI.ContextMenu.LT] : [Colibri.UI.ContextMenu.RB, Colibri.UI.ContextMenu.RT], '', args.isContextMenuEvent ? {left: args.domEvent.clientX, top: args.domEvent.clientY} : null);

        }

    }

    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */ 
    __clickOnUserAndRolesContextMenu(event, args) {

        const item = args?.item;
        const menuData = args.menuData;
        if(!menuData || !item) {
            return false;
        }

        switch(menuData.name) {
            case 'add-user': {
                Manage.FormWindow.Show('#{security-windowtitle-adduser}', 800, 'app.manage.storages(users)', {})
                    .then((data) => {
                        Security.SaveUser(data);
                    })
                    .catch(() => {});
                break;                                
            }
            case 'add-role': {
                Manage.FormWindow.Show('#{security-windowtitle-addrole}', 800, 'app.manage.storages(roles)', {})
                    .then((data) => {
                        Security.SaveRole(data);
                    })
                    .catch(() => {});
                break;                                
            }
            case 'edit-role': {
                Manage.FormWindow.Show('#{security-windowtitle-editrole}', 800, 'app.manage.storages(roles)', item.tag)
                    .then((data) => {
                        Security.SaveRole(data);
                    })
                    .catch(() => {});

                break;                                
            }
            case 'delete-role': {
                App.Confirm.Show('#{security-windowtitle-removerole}', '#{security-messages-removerolemessage}').then(() => {
                    Security.RemoveRole(item.tag);
                });
                break;                                
            }
            case 'edit-user': {
                Manage.FormWindow.Show('#{security-windowtitle-edituser}', 800, 'app.manage.storages(users)', item.tag)
                    .then((data) => {
                        Security.SaveUser(data);
                    })
                    .catch(() => {});
                break;                                
            }
            case 'delete-user': {
                const current = Security.Store.Query('security.user');
                if(current.id == item.tag.id) {
                    App.Notices.Add(new Colibri.UI.Notice('#{security-messages-removeselfmessage}'));
                }
                else {
                    App.Confirm.Show('#{security-windowtitle-removeuser}', '#{security-messages-removeusermessage}').then(() => {
                        Security.RemoveUser(item.tag);
                    });    
                }
                break;                                
            }
        }

    }

}