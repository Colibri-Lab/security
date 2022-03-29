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
                required: true,
                readonly: false,
                params: {
                    validate: [
                        {
                            message: 'Пожалуйста, введите эл. адрес',
                            method: '(field, validator) => !!field.value'
                        }
                    ]
                }
            },
            password: {
                component: 'Password',
                required: true,
                reqdonly: false,
                params: {
                    validate: [
                        {
                            message: 'Пожалуйста, введите пароль',
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