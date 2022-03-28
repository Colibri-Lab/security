<?php

namespace App\Modules\Security;

use Colibri\Modules\Module as BaseModule;
use Colibri\App;
use App\Modules\Security\Helpers\DemoAttacher;
use Colibri\Common\DateHelper;
use App\Modules\Security\SSClient\Api;
use Colibri\Utils\Debug;
use App\Modules\Security\Models\Users;
use App\Modules\Security\Models\Organizations;
use App\Modules\Security\Models\Organization;
use App\Modules\Security\Models\UserOrg;
use App\Modules\Security\Helpers\OldAuthHelper;
use App\Modules\Security\Models\User;
use App\Modules\MainFrame\Module as MainFrameModule;
use CometApiClient\Client as CometApiClient;
use App\Modules\Security\SSClient\JWToken;
use App\Modules\Security\Models\UserOrgs;
use PHPMailer\PHPMailer\PHPMailer;
use Colibri\Utils\Menu\Item;
use App\Modules\Security\Models\Members;
use App\Modules\Security\Models\Member;
use Colibri\Common\RandomizationHelper;
use Colibri\Common\SmtpHelper;

/**
 * Модуль авторизация
 * @author Vahan P. Grigoryan
 * @package App\Modules\Security
 * 
 * @property-read JWToken $current данные текущей сессии
 * @property-read User $user данные текущего польователя
 * @property-read Organization $organization данные текущей организации
 * @property-read Organizations $organizations организации пользователя
 * @property-read UserOrg $organization_data связь с текущей организацией
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

        $member = Members::LoadById($this->_id);
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

    public function Login($email, $password) 
    {

        $member = Members::LoadByEmail($email);
        if(!$member) {
            return false;
        }

        if(!$member->Authorize($password)) {
            return false;
        }

        $this->_id = $member->id;
        $this->_hash = $password;
        $this->_current = $member;
        $this->Store();

        return true;

    }

    public function Register($data) {

        $data = (object)$data;

        if(Members::LoadByEmail($data->email)) {
            return false;
        }

        $password = RandomizationHelper::Mixed(10);

        /** @var Member */
        $member = Members::LoadEmpty();
        $member->email = $data->email;
        $member->phone = $data->phone;
        $member->password = $password;
        $member->fio = $data->fio;
        $member->info = $data->info;

        if(!$member->Save()) {
            return false;
        }

        $member->Notify('register');        
        
        return $member;

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

        $modulesList = App::$moduleManager->list;
        foreach($modulesList as $module) {
            if(is_object($module) && method_exists($module, 'GetPersmissions') && !($module instanceof self)) {
                $permissions = array_merge($permissions, $module->GetPersmissions());
            }
        }

        return $permissions;
    }

    public function GetTopmostMenu($hideExecuteCommand = true) {

        return Item::Create('more', 'ЕЩЕ', 'blue', false, '')->Add(

            Item::Create('profile', 'Личный кабинет', '', false, '')->Add(
                Item::Create('requisites', 'Реквизиты', '', false, 'Security.RouteTo("/lk/form/requisites/")')
            )->Add(
                Item::Create('legalAddress', 'Юридический адрес', '', false, 'Security.RouteTo("/lk/form/legalAddress/")')
            )->Add(
                Item::Create('actualAddress', 'Фактический адрес', '', false, 'Security.RouteTo("/lk/form/actualAddress/")')
            )->Add(
                Item::Create('contacts', 'Контактное лицо', '', false, 'Security.RouteTo("/lk/form/contacts/")')
            )->Add(
                Item::Create('bank', 'Банковские данные', '', false, 'Security.RouteTo("/lk/form/bank/")')
            )->Add(
                Item::Create('sending', 'Отправка заказов', '', false, 'Security.RouteTo("/lk/sending/")')
            )->Add(
                Item::Create('delivery', 'Доставка', '', false, 'Security.RouteTo("/lk/delivery/")')
            )->Add(
                Item::Create('subscription', 'Рассылка', '', false, 'Security.RouteTo("/lk/subscription/")')
            )

        )->Add(

            Item::Create('orders', 'Мои заказы', '', false, '')->Add(
                Item::Create('current', 'Текущий заказ', '', false, 'Security.RouteTo("/orders/current/")')
            )->Add(
                Item::Create('all', 'Все заказы', '', false, 'Security.RouteTo("/orders/all/")')
            )->Add(
                Item::Create('statistics', 'Статистика', '', false, 'Security.RouteTo("/orders/stats/")')
            )

        );

    }


    
}
