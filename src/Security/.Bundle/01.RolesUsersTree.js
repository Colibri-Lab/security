App.Modules.Security.RolesUsersTree = class extends Colibri.UI.Tree {
    
    constructor(name, container) {
        super(name, container);
        this._rolesList = [];
        this._usersList = [];
    }

    __renderBoundedValues(users) {

        Security.Store.AsyncQuery('security.roles').then((roles) =>{

            if(!Array.isArray(users) && Object.isObject(data)) {
                users = Object.values(users);
            }
            if(!Array.isArray(roles) && Object.isObject(data)) {
                roles = Object.values(roles);
            }
    
    
            this._usersList = users;
            this._rolesList = roles;

            let foundRoles = [];
            this._rolesList.forEach((role) => {
                let newNode = this.FindNode(role.id + role.name);
                if(!newNode) {
                    newNode = this.nodes.Add(role.id + role.name);
                }
                newNode.text = role.name;
                newNode.isLeaf = true;
                newNode.icon = App.Modules.Security.Icons.RoleIcon;
                newNode.tag = role;    
                foundRoles.push(role.id + role.name);
            }); 

            let foundUsers = [];
            this._usersList.forEach((user) => {

                const roleNode = this.FindNode(user.role.id + user.role.name);
                if(!roleNode) {
                    return true;
                }
                let newNode = this.FindNode(user.id + user.login);
                if(!newNode) {
                    newNode = roleNode.nodes.Add(user.id + user.login);
                }

                if(user.role.id != newNode.parentNode?.tag?.id) {
                    newNode.MoveTo(roleNode);
                    roleNode.Expand();
                }

                newNode.text = user.login;
                newNode.toolTip = user.fio.lastName + ' ' + user.fio.firstName + ' ' + user.fio.patronymic;
                newNode.isLeaf = true;
                newNode.icon = App.Modules.Security.Icons.UserIcon;
                newNode.tag = user;
                
                roleNode.isLeaf = false;    
                foundUsers.push(user.id + user.login);
            }); 

            this.allNodes.forEach((node) => {
                if(node.tag.role != undefined) {
                    if(foundUsers.indexOf(node.name) === -1) {
                        node.Dispose();
                    }    
                }
                else {
                    if(foundRoles.indexOf(node.name) === -1) {
                        node.Dispose();
                    }
                }
            });

        });


    }
    
}