<?php


namespace App\Modules\Security\Controllers;

use Colibri\Rpc\Controller as RpcController;
use App\Modules\Security\Module;
use Colibri\Web\RequestCollection;
use Colibri\Web\PayloadCopy;
use Colibri\Data\Storages\Storages;
use App\Modules\Security\Models\Member;
use App\Modules\Security\Models\Users;
use App\Modules\Security\Models\UserRoles;
use Colibri\App;

class ClientController extends RpcController
{

    public function Settings(RequestCollection $get, RequestCollection $post, ?PayloadCopy $payload): object
    {
        $isLogged = Module::$instance->IsLogged();
        $member = null;
        if ($isLogged) {
            $member = Module::$instance->current->ToArray(true);
        }
        $permissions = App::$moduleManager->GetPermissions();
        return $this->Finish(200, 'ok', ['settings' => ['logged' => $isLogged, 'permissions' => $permissions], 'user' => $member]);
    }

    public function Roles(RequestCollection $get, RequestCollection $post, ?PayloadCopy $payload): object
    {

        if(!Module::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        if(!Module::$instance->current->IsCommandAllowed('security.administrate.roles')) {
            return $this->Finish(403, 'Permission denied');
        }

        $roles = UserRoles::LoadAll();

        return $this->Finish(200, 'ok', $roles->ToArray(true));
    }

    public function Users(RequestCollection $get, RequestCollection $post, ?PayloadCopy $payload): object
    {
        if(!Module::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        if(!Module::$instance->current->IsCommandAllowed('security.administrate.users')) {
            return $this->Finish(403, 'Permission denied');
        }

        $users = Users::LoadAll();

        return $this->Finish(200, 'ok', $users->ToArray(true));
    }

    public function SaveUser(RequestCollection $get, RequestCollection $post, ?PayloadCopy $payload): object
    {

        if(!Module::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        $id = $post->id;
        if (!$id) {
            return $this->Finish(400, 'Bad request');
        }

        if(Module::$instance->current->id != $id && !Module::$instance->current->IsCommandAllowed('security.administrate.users.save')) {
            return $this->Finish(403, 'Permission denied');
        }

        $password = $post->password;
        $role = $post->role['id'];
        $fio = $post->fio;
        $phone = $post->phone;
        $avatar = App::$request->files->avatar;

        $user = Module::$instance->current;
        if ($password) {
            $user->password = $password;
        }

        if(!$avatar) {
            $user->avatar = null;    
        }
        else { 
            $user->avatar->ConvertFromFile($avatar);
        }

        $user->role = UserRoles::LoadById($role);
        $user->fio = $fio;
        $user->phone = $phone;
        $user->permissions = $post->permissions;
        $user->Save();

        return $this->Finish(200, 'ok', $user->ToArray(true));
    }


    public function SaveRole(RequestCollection $get, RequestCollection $post, ?PayloadCopy $payload): object
    {

        if(!Module::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        $id = $post->id;
        if(!$id && !Module::$instance->current->IsCommandAllowed('security.administrate.users.add')) {
            return $this->Finish(403, 'Permission denied');
        }
        else if(!Module::$instance->current->IsCommandAllowed('security.administrate.users.save')) {
            return $this->Finish(403, 'Permission denied');
        }

        if($id) {
            $role = UserRoles::LoadById($id);
        }
        else {
            $role = UserRoles::LoadEmpty();
        }
        $role->name = $post->name;
        $role->permissions = $post->permissions;
        $role->Save();

        return $this->Finish(200, 'ok', $role->ToArray(true));

    }
    public function Login(RequestCollection $get, RequestCollection $post, ?PayloadCopy $payload): object
    {

        if (!$post->login || !$post->password) {
            return $this->Finish(400, 'Bad request', []);
        }

        $result = Module::$instance->Login($post->login, $post->password);
        if ($result) {
            return $this->Finish(200, 'Logged');
        }
        else {
            return $this->Finish(403, 'Access denied');
        }

    }

    public function Logout(RequestCollection $get, RequestCollection $post, ?PayloadCopy $payload): object
    {
        Module::$instance->current->Logout();
        Module::$instance->ClearSession();
        return $this->Finish(200, 'Unlogged');
    }


}
