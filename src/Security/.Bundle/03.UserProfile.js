App.Modules.Security.UserProfile = class extends Colibri.UI.Component {
    constructor(name, container) {
        super(name, container, Colibri.UI.Templates['App.Modules.Security.UserProfile']);
        
        this.AddClass('app-user-profile-component');

        this._icon = this.Children('user-flex/icon');
        this._userName = this.Children('user-flex/info/name');
        this._logout = this.Children('user-flex/logout');

        this._logout.AddHandler('Clicked', (event, args) => this.Dispatch('LogoutClicked'));
        this._icon.AddHandler('Clicked', (event, args) => this.Dispatch('ProfileClicked'));
        this._userName.AddHandler('Clicked', (event, args) => this.Dispatch('ProfileClicked'));
    }

    _registerEvents() {
        super._registerEvents();
        this.RegisterEvent('LogoutClicked', false, 'Когда кликнули на выход');
        this.RegisterEvent('ProfileClicked', false, 'Когда кликнули на профиль');
    }

    __renderBoundedValues(data) {
        if(!data || !data?.id) {
            return;
        }

        this._userName.value = data.fio.lastName + ' ' + data.fio.firstName;

    }

}
