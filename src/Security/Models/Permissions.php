<?php

namespace App\Modules\Security\Models;
use Colibri\Data\Storages\Fields\ArrayField;

class Permissions extends ArrayField
{

    /**
     * Возвращает обьект по индексу
     * @param int $index индекс
     * @return Permission обьект
     */
    public function Item(int $index): Permission
    {
        return $this->data[$index] instanceof Permission ? $this->data[$index] : new Permission($this->data[$index], $this->_storage, $this->_field);
    }

}
