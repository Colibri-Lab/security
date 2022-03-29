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


    public function InitializeModule()
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
    public function __get($property)
    {
        $return = null;
        if (strtolower($property) === 'current') {
            $return = $this->_current;
        }
        
        return $return ? $return : parent::__get($property);

    }

    public function Restore() 
    {

        if(version_compare(PHP_VERSION, '7.3.0') !== -1 && !headers_sent()) {
            session_set_cookie_params(["SameSite" => "None"]); //none, lax, strict
            session_set_cookie_params(["Secure" => "true"]); //false, true        
        }
        @session_start();
        $this->_id = isset($_SESSION['SS_MEMBER']) ? $_SESSION['SS_MEMBER'] : null;
        $this->_hash = isset($_SESSION['SS_HASH']) ? $_SESSION['SS_HASH'] : null;
        @session_write_close();

        $member = Users::LoadById($this->_id);
        if(!$member) {
            $this->ClearSession();
            return;
        }

        if(!$member->Authorize($this->_hash)) {
            $this->ClearSession();
            return;
        }

        $this->_current = $member;

    }

    public function Store()
    {
        // если версия выше 7.3.0
        if(version_compare(PHP_VERSION, '7.3.0') !== -1 && !headers_sent()) {
            session_set_cookie_params(["SameSite" => "None"]); //none, lax, strict
            session_set_cookie_params(["Secure" => "true"]); //false, true        
        }
        
        @session_start();
        $_SESSION['SS_MEMBER'] = $this->_id;
        $_SESSION['SS_HASH'] = $this->_hash;
        @session_write_close();

    }

    public function ClearSession() {
        if(version_compare(PHP_VERSION, '7.3.0') !== -1 && !headers_sent()) {
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

    public function IsLogged()
    { 
        return (bool)$this->_id;
    }

    public function Login($login, $password) 
    {

        $member = Users::LoadByLogin($login);
        if(!$member) {
            return false;
        }

        if(!$member->Authorize($password)) {
            return false;
        }

        if(!$member->IsCommandAllowed('security.login')) {
            return false;
        }

        $this->_id = $member->id;
        $this->_hash = $password;
        $this->_current = $member;
        $this->Store();

        return true;

    }

    public function GetPermissions()
    {
        // создаем набор прав, на будущее
        // $permissions = parent::GetPermissions()
        // $className = static::class
        // $permissionsName = strtolower(str_replace('\\', '.', $className))
        // $permissions[ $permissionsName.'.test.write' ] = 'Тестовое правило записи'
        // return $permissions;

        $permissions = parent::GetPermissions();

        $permissions['security'] = 'Использовать модуль';
        $permissions['security.login'] = 'Выполнять вход в административную консоль';
        $permissions['security.profile'] = 'Редактировать свой профиль';

        $permissions['security.roles'] = 'Доступ к ролям';
        $permissions['security.users'] = 'Доступ к пользователям';
        $permissions['security.roles.add'] = 'Создать роль';
        $permissions['security.roles.save'] = 'Сохранить роль';
        $permissions['security.roles.remove'] = 'Удалить роль';
        $permissions['security.users.add'] = 'Создать пользователя';
        $permissions['security.users.save'] = 'Сохранить пользователя';
        $permissions['security.users.remove'] = 'Удалить пользователя';

        return $permissions;
    }

    public function GetTopmostMenu($hideExecuteCommand = true) {

        return Item::Create('more', 'ЕЩЕ', 'blue', false, '')->Add(

            Item::Create('security', 'Безопасность', '', false, '')->Add(
                Item::Create('profile', 'Личный кабинет', '', false, 'Security.RouteTo("/security/profile/")')
            )->Add(
                Item::Create('users', 'Пользователи', '', false, 'Security.RouteTo("/security/users/")')
            )->Add(
                Item::Create('roles', 'Роли', '', false, 'Security.RouteTo("/security/roles/")')
            )->Add(
                Item::Create('permissions', 'Права доступа', '', false, 'Security.RouteTo("/security/permissions/")')
            )
        );

    }


    
}
