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
        $userFields = Storages::Create()->Load('users')->ToArray();
        $isLogged = Module::$instance->IsLogged();
        $member = null;
        if ($isLogged) {
            $member = Module::$instance->current->ToArray(true);
        }
        $permissions = App::$moduleManager->GetPermissions();
        return $this->Finish(200, 'ok', ['settings' => ['logged' => $isLogged, 'permissions' => $permissions, 'fields' => ['user' => $userFields['fields']]], 'user' => $member]);
    }

    public function Roles(RequestCollection $get, RequestCollection $post, ?PayloadCopy $payload): object
    {

        $roles = UserRoles::LoadAll();

        return $this->Finish(200, 'ok', $roles->ToArray(true));
    }

    public function Save(RequestCollection $get, RequestCollection $post, ?PayloadCopy $payload): object
    {

        $id = $post->id;
        if (!$id) {
            return $this->Finish(400, 'Bad request');
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
        $user->Save();

        return $this->Finish(200, 'ok', $user->ToArray(true));
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
