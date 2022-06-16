<?php

namespace App\Modules\Security;

use Colibri\Modules\Module as BaseModule;
use Colibri\App;
use App\Modules\Security\Models\Users;
use App\Modules\Security\Models\User;
use Colibri\Utils\Menu\Item;
use Colibri\Common\RandomizationHelper;
use Colibri\Encryption\Crypt;
use Colibri\Utils\Debug;

/**
 * Модуль авторизация
 * @author Vahan P. Grigoryan
 * @package App\Modules\Security
 * 
 * @property-read User $current
 * 
 */
class Module extends BaseModule
{

    /** @var Module */
    public static $instance = null;

    private $_id;
    private $_hash;

    private $_current;


    public function InitializeModule(): void
    {

        self::$instance = $this;

        $this->Restore();

    }

    public function __destruct()
    {
        $this->Store();
    }

    /**
     * Геттер
     * @param string $property свойство
     * @return mixed 
     */
    public function __get(string $property): mixed
    {
        $return = null;
        if (strtolower($property) === 'current') {
            $return = $this->_current;
        }

        return $return ? $return : parent::__get($property);

    }

    public function Restore(): void
    {

        if (version_compare(PHP_VERSION, '7.3.0') !== -1 && !headers_sent() && !App::$request->insecure) {
            session_set_cookie_params(["SameSite" => "None"]); //none, lax, strict
            session_set_cookie_params(["Secure" => "true"]); //false, true        
        }
        @session_start();
        $this->_id = isset($_SESSION['SS_MEMBER']) ? $_SESSION['SS_MEMBER'] : null;
        $this->_hash = isset($_SESSION['SS_HASH']) ? $_SESSION['SS_HASH'] : null;
        @session_write_close();

        if(!$this->_id) {
            return;
        }

        $member = Users::LoadById($this->_id);
        if (!$member) {
            $this->ClearSession();
            return;
        }

        if (!$member->Authorize($this->_hash)) {
            $this->ClearSession();
            return;
        }

        $this->_current = $member;

    }

    public function Store(): void
    {
        // если версия выше 7.3.0
        if (version_compare(PHP_VERSION, '7.3.0') !== -1 && !headers_sent() && !App::$request->insecure) {
            session_set_cookie_params(["SameSite" => "None"]); //none, lax, strict
            session_set_cookie_params(["Secure" => "true"]); //false, true        
        }

        @session_start();
        $_SESSION['SS_MEMBER'] = $this->_id;
        $_SESSION['SS_HASH'] = $this->_hash;
        @session_write_close();

    }

    public function ClearSession(): void
    {
        if (version_compare(PHP_VERSION, '7.3.0') !== -1 && !headers_sent() && !App::$request->insecure) {
            session_set_cookie_params(["SameSite" => "None"]); //none, lax, strict
            session_set_cookie_params(["Secure" => "true"]); //false, true        
        }
        session_start();
        $_SESSION['SS_MEMBER'] = null;
        $_SESSION['SS_HASH'] = null;
        session_write_close();

        $this->_id = null;
        $this->_hash = null;
        $this->_current = null;
    }

    public function IsLogged(): bool
    {
        return (bool)$this->_id;
    }

    public function Login(string $login, string $password): bool
    {

        $member = Users::LoadByLogin($login);
        if (!$member) {
            return false;
        }

        if (!$member->Authorize($password)) {
            return false;
        }

        if (!$member->IsCommandAllowed('security.login')) {
            return false;
        }

        $this->_id = $member->id;
        $this->_hash = $password;
        $this->_current = $member;
        $this->Store();

        return true;

    }

    public function GetPermissions(): array
    {
        $permissions = parent::GetPermissions();

        $permissions['security'] = 'Использовать модуль';
        $permissions['security.login'] = 'Выполнять вход в административную консоль';
        $permissions['security.profile'] = 'Редактировать свой профиль';

        $permissions['security.profile.passwordchange'] = 'Изменять свой пароль';
        $permissions['security.profile.rolechange'] = 'Изменять свою роль';
        $permissions['security.profile.loginchange'] = 'Изменять свой логин';

        $permissions['security.administrate'] = 'Доступ к администрированию';
        $permissions['security.administrate.roles'] = 'Список ролей';
        $permissions['security.administrate.roles.add'] = 'Создать роль';
        $permissions['security.administrate.roles.save'] = 'Сохранить роль';
        $permissions['security.administrate.roles.remove'] = 'Удалить роль';
        $permissions['security.administrate.users'] = 'Список пользователей';
        $permissions['security.administrate.users.add'] = 'Создать пользователя';
        $permissions['security.administrate.users.save'] = 'Сохранить пользователя';
        $permissions['security.administrate.users.remove'] = 'Удалить пользователя';

        return $permissions;
    }

    public function GetTopmostMenu(bool $hideExecuteCommand = true): Item|array|null
    {
        return Item::Create('more', '#{mainframe-menu-more;Инструменты}', '', 'App.Modules.MainFrame.Icons.MoreIcon', '')->Add(
            Item::Create('users', '#{security-menu-usersandroles;Пользователи и роли}', '#{security-menu-usersandroles-desc;Административная панель, пользователи и роли}', 'App.Modules.Security.Icons.UserAndRolesIcon', 'App.Modules.Security.AdministratePage')
        );
    }




}
