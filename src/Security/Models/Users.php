<?php

namespace App\Modules\Security\Models;

use Colibri\Data\DataAccessPoint;
use Colibri\Data\SqlClient\IDataReader;
use Colibri\Data\Storages\Storages;
use Colibri\Data\Storages\Storage;
use Colibri\Data\Storages\Models\DataTable as BaseModelDataTable;
use App\Modules\Security\Models\User;

/**
 * Таблица, представление данных в хранилище Пользователи системы безопасности
 * @author <author name and email>
 * @package App\Modules\Security\Models
 * 
 * @method User[] getIterator()
 * @method User _createDataRowObject()
 * @method User _read()
 * 
 */
class Users extends BaseModelDataTable
{

    /**
     * Конструктор
     * @param DataAccessPoint $point точка доступа
     * @param IDataReader|null $reader ридер
     * @param string|\Closure $returnAs возвращать в виде класса
     * @param Storage|null $storage хранилище
     * @return void 
     */
    public function __construct(DataAccessPoint $point, IDataReader $reader = null, string $returnAs = 'User', Storage|null $storage = null)
    {
        parent::__construct($point, $reader, $returnAs, $storage);
    }


    /**
     * Создание модели по названию хранилища
     * @param int $page страница
     * @param int $pagesize размер страницы
     * @param string $filter строка фильтрации
     * @param string $order сортировка
     * @param array $params параметры к запросу
     * @return Users
     */
    static function LoadByFilter(int $page = -1, int $pagesize = 20, string $filter = null, string $order = null, array $params = []): Users
    {
        $storage = Storages::Create()->Load('users');
        return self::LoadByQuery(
            $storage,
            'select * from ' . $storage->name .
            ($filter ? ' where ' . $filter : '') .
            ($order ? ' order by ' . $order : ''),
        ['page' => $page, 'pagesize' => $pagesize, 'params' => $params]
        );
    }

    /**
     * Загружает без фильтра
     * @param int $page страница
     * @param int $pagesize размер страницы
     * @return Users 
     */
    static function LoadAll(int $page = -1, int $pagesize = 20): Users
    {
        return self::LoadByFilter($page, $pagesize, null, null);
    }

    /**
     * Возвращает модель по ID
     * @param int $id ID строки
     * @return User|null
     */
    static function LoadById(int $id): User|null
    {
        $table = self::LoadByFilter(1, 1, '{id}=[[id:integer]]', null, ['id' => $id]);
        return $table->Count() > 0 ? $table->First() : null;
    }

    /**
     * Возвращает модель по login
     * @param string $login Логин строки
     * @return User|null
     */
    static function LoadByLogin(string $login): User|null
    {
        $table = self::LoadByFilter(1, 1, '{login}=[[login:string]]', null, ['login' => $login]);
        return $table->Count() > 0 ? $table->First() : null;
    }

    /**
     * Возвращает список пользователей по роли
     * @param UserRole|int $role роль
     * @return Users
     */
    static function LoadByRole(UserRole|int $role): Users
    {
        if(!is_numeric($role)) {
            $role = $role->id;
        }
        return self::LoadByFilter(1, 1, '{role}=[[role:string]]', null, ['role' => $role]);
    }


    /**
     * Создание модели по названию хранилища
     * @return User
     */
    static function LoadEmpty(): User
    {
        $reports = self::LoadByFilter(-1, 20, 'false');
        return $reports->CreateEmptyRow();
    }

}