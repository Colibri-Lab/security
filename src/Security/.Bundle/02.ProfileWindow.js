App.Modules.Security.ProfileWindow = class extends Colibri.UI.Window {

    constructor(name, container) {
        super(name, container, Colibri.UI.Templates['App.Modules.Security.ProfileWindow'], 'Личный кабинет', 800);

        this.AddClass('app-profile-form-window-component');

        this._form = this.Children('form');
        this._validator = new Colibri.UI.FormValidator(this._form);

        this._form.fields = Security.Store.Query('security.settings.fields.user');

        this._cancel = this.Children('cancel');
        this._save = this.Children('save');

        this._validator.AddHandler('Validated', () => this._save.enabled = this._validator.Validate());
        this._save.AddHandler('Clicked', () => {
            Security.SaveUser(this._form.value);
            this.Hide();
        });
        
    }

    Show() {
        this.shown = true;        
        this._form.value = Security.Store.Query('security.user');
    }

}