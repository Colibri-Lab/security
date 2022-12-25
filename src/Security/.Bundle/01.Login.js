App.Modules.Security.Login = class extends Colibri.UI.Component {

    constructor(name, container) {
        /* создаем компонент и передаем шаблон */
        super(name, container, Colibri.UI.Templates['App.Modules.Security.Login']); 

        this.AddClass('app-security-login-component');

        this._form = this.Children('login-paywall/form-container/form')
        this._validator = new Colibri.UI.FormValidator(this._form);
        this._loginButton = this.Children('login-paywall/button-container/login');

        this._form.fields = {
            login: {
                component: 'Text',
                params: {
                    required: true, 
                    readonly: false,
                    validate: [
                        {
                            message: '#{security-loginform-login-validation1}',
                            method: '(field, validator) => !!field.value'
                        }
                    ]
                }
            },
            password: {
                component: 'Password',
                params: {
                    required: true,
                    reqdonly: false,
                    validate: [
                        {
                            message: '#{security-loginform-password-validation1}',
                            method: '(field, validator) => !!field.value'
                        }
                    ]
                }
            }
        };

        this._validator.AddHandler('Validated', (event, args) => this._loginButton.enabled = this._validator.Validate());

        this._loginButton.AddHandler('Clicked', (event, args) => {
            Security.Login(this._form.value.login, this._form.value.password);
        });

    }

}