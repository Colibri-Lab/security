App.Modules.Security.RolesUsersTree = class extends Colibri.UI.Tree {
    
    constructor(name, container) {
        super(name, container);
        this._rolesList = [];
        this._usersList = [];
    }

    __renderBoundedValues(users) {

        Security.Store.AsyncQuery('security.roles').then((roles) =>{

            if(!Array.isArray(users) && data instanceof Object) {
                users = Object.values(users);
            }
            if(!Array.isArray(roles) && data instanceof Object) {
                roles = Object.values(roles);
            }
    
    
            this._usersList = users;
            this._rolesList = roles;

            this._rolesList.forEach((role) => {
                let newNode = this.FindNode(role.id + role.name);
                if(!newNode) {
                    newNode = this.nodes.Add(role.id + role.name);
                }
                newNode.text = role.name;
                newNode.isLeaf = true;
                newNode.icon = App.Modules.Sites.Icons.FolderIconUnpublished;
                newNode.tag = role;    
            }); 

            this._usersList.forEach((user) => {

                const roleNode = this.FindNode(user.role.id + user.role.name);
                if(!roleNode) {
                    return true;
                }
                let newNode = this.FindNode(user.id + user.login);
                if(!newNode) {
                    newNode = roleNode.nodes.Add(user.id + user.login);
                }

                newNode.text = user.login;
                newNode.toolTip = user.fio.lastName + ' ' + user.fio.firstName + ' ' + user.fio.patronymic;
                newNode.isLeaf = true;
                newNode.icon = App.Modules.Sites.Icons.FolderIconUnpublished;
                newNode.tag = user;
                
                roleNode.isLeaf = false;    
            }); 

    
        });


    }
    
}