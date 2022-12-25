App.Modules.Security.PermissionsTree = class extends Colibri.UI.Tree {
    
    constructor(name, container) {
        super(name, container);
        this._permissionsObject = [];
        this._userOrRole = null;
    }

    _findLevel(parent) {
        let ret = [];
        Object.forEach(this._permissionsObject, (permission, desc) => {
            if(permission.indexOf(parent) === 0 && permission.split('.').length == parent.split('.').length + 1) {
                ret.push({
                    name: permission, 
                    desc: desc, 
                    isLeaf: this._findLevel(permission).length === 0
                });
            }
        });
        return ret;
    }

    _renderLevel(node, parent) {

        const permissions = this._findLevel(parent);
        permissions.forEach((perm) => {

            let newNode = this.FindNode(perm.name);
            if(!newNode) {
                newNode = node.nodes.Add(perm.name);
            }
            newNode.text = perm.desc + ' (' + perm.name + ')';
            newNode.isLeaf = perm.isLeaf;
            newNode.icon = App.Modules.Security.Icons.PermissionNotSetIcon;
            newNode.tag = perm;
            this._renderLevel(newNode, perm.name);

        });

    }

    _removeUnexistent() {
        this.allNodes.forEach((node) => {
            if(this._permissionsObject[node.tag.name] === -1) {
                node.Dispose();
            }
        });
    }

    _updatePermissions() {
        if(!this._userOrRole) {
            this.allNodes.forEach((node) => {
                node.icon = App.Modules.Security.Icons.PermissionNotSetIcon;
            });
        }
        else {
            this.allNodes.forEach((node) => {
                let icon = App.Modules.Security.Icons.PermissionNotSetIcon;
                const perm = node.tag;

                const commandSet = Security.IsCommandSet(perm.name, this._userOrRole);
                const commandSetChilds = Security.IsCommandSet(perm.name + '.*', this._userOrRole);
                const access = Security.IsCommandAllowed(perm.name, this._userOrRole);
    
                if(!commandSet && access === null) {
                    icon = App.Modules.Security.Icons.PermissionNotSetIcon;
                }
                else if(commandSet && access === null) {
                    // не может быть
                }
                else if(!commandSet && access === true) {
                    icon = App.Modules.Security.Icons.PermissionNotSetButAllowedIcon;
                }
                else if(!commandSet && access === false) {
                    icon = App.Modules.Security.Icons.PermissionNotSetButDeniedIcon;
                }
                else if(commandSet && access === true) {
                    icon = App.Modules.Security.Icons.PermissionAllowedIcon;
                }
                else if(commandSet && access === false) {
                    icon = App.Modules.Security.Icons.PermissionDeniedIcon;
                } 
                node.icon = icon;

            });
        }
    }

    __renderBoundedValues(data) {

        let ret = {};
        ret['app'] = 'Права на все';
        Object.forEach(data, (perm, desc) => {
            ret['app.' + perm] = desc;
        });

        this._permissionsObject = ret;
        
        let newNode = this.FindNode('app');
        if(!newNode) {
            newNode = this.nodes.Add('app');
        }
        newNode.text = '#{security-permissions-all} (*)'; 
        newNode.isLeaf = false;
        newNode.icon = App.Modules.Security.Icons.PermissionNotSetIcon;
        newNode.tag = {name: 'app', desc: '#{security-permissions-all}', isLeaf: false};
        this._renderLevel(newNode, 'app');
        this._removeUnexistent();

        this.ExpandAll();

    }

    get user() {
        return this._userOrRole;
    }

    set user(value) {
        this._userOrRole = value;
        this._updatePermissions();
    }
    
}