<?php

namespace App\Modules\Security;

/**
 * @suppress PHP0419
 */
class Installer
{

    private static function _copyOrSymlink($mode, $pathFrom, $pathTo, $fileFrom, $fileTo): void
    {
        print_r('Копируем ' . $mode . ' ' . $pathFrom . ' ' . $pathTo . ' ' . $fileFrom . ' ' . $fileTo . "\n");
        if (!file_exists($pathFrom . $fileFrom)) {
            print_r('Файл ' . $pathFrom . $fileFrom . ' не существует' . "\n");
            return;
        }

        if (file_exists($pathTo . $fileTo)) {
            print_r('Файл ' . $pathTo . $fileTo . ' существует' . "\n");
            return;
        }

        if ($mode === 'local') {
            shell_exec('ln -s ' . realpath($pathFrom . $fileFrom) . ' ' . $pathTo . ($fileTo != $fileFrom ? $fileTo : ''));
        } else {
            shell_exec('cp -R ' . realpath($pathFrom . $fileFrom) . ' ' . $pathTo . $fileTo);
        }

        // если это исполняемый скрипт
        if (strstr($pathTo . $fileTo, '/bin/') !== false) {
            chmod($pathTo . $fileTo, 0777);
        }
    }


    private static function _loadConfig($file): ?array
    {
        return yaml_parse_file($file);
    }

    private static function _saveConfig($file, $config): void
    {
        yaml_emit_file($file, $config, \YAML_UTF8_ENCODING, \YAML_ANY_BREAK);
    }

    private static function _getMode($file): string
    {
        $appConfig = self::_loadConfig($file);
        return $appConfig['mode'];
    }

    private static function _injectIntoModuleConfig($file): void
    {

        $modules = self::_loadConfig($file);
        if (is_array($modules['entries'])) {
            foreach ($modules['entries'] as $entry) {
                if ($entry['name'] === 'Security') {
                    return;
                }
            }
        } else {
            $modules['entries'] = [];
        }

        // добавляем в начало
        $modules['entries'] = array_merge([
            [
                'name' => 'Security',
                'entry' => '\Security\Module',
                'desc' => 'Система безопасности',
                'enabled' => true,
                'visible' => false,
                'for' => ['manage'],
                'config' => 'include(/config/security.yaml)'
            ]
        ], $modules['entries']);

        self::_saveConfig($file, $modules);

    }


    /**
     * 
     * @param \Composer\Installer\PackageEvent $event 
     * @return void 
     */
    public static function PostPackageInstall($event)
    {

        print_r('Установка и настройка модуля Авторизация' . "\n");

        $vendorDir = $event->getComposer()->getConfig()->get('vendor-dir') . '/';

        $operation = $event->getOperation();
        $installedPackage = $operation->getPackage();
        $targetDir = $installedPackage->getName();
        $path = $vendorDir . $targetDir;
        $configPath = $path . '/src/Security/config-template/';
        $configDir = './config/';

        if (!file_exists($configDir . 'app.yaml')) {
            print_r('Не найден файл конфигурации app.yaml' . "\n");
            return;
        }

        // берем точку входа
        $webRoot = \getenv('COLIBRI_WEBROOT');
        if (!$webRoot) {
            $webRoot = 'web';
        }
        $mode = self::_getMode($configDir . 'app.yaml');

        // копируем конфиг
        print_r('Копируем файлы конфигурации' . "\n");
        self::_copyOrSymlink($mode, $configPath, $configDir, 'module-' . $mode . '.yaml', 'security.yaml');
        self::_copyOrSymlink($mode, $configPath, $configDir, 'security-storages.yaml', 'security-storages.yaml');
        self::_copyOrSymlink($mode, $configPath, $configDir, 'security-langtexts.yaml', 'security-langtexts.yaml');

        print_r('Встраиваем модуль' . "\n");
        self::_injectIntoModuleConfig($configDir . 'modules.yaml');

        print_r('Копирование изображений' . "\n");
        self::_copyOrSymlink($mode, $path . '/src/Security/web/res/img/', './' . $webRoot . '/res/img/', 'security-arrow.svg', 'security-arrow.svg');
        self::_copyOrSymlink($mode, $path . '/src/Security/web/res/img/', './' . $webRoot . '/res/img/', 'security-logo-only.svg', 'security-logo-only.svg');
        self::_copyOrSymlink($mode, $path . '/src/Security/web/res/img/', './' . $webRoot . '/res/img/', 'security-icon-cart-white.svg', 'security-icon-cart-white.svg');
        self::_copyOrSymlink($mode, $path . '/src/Security/web/res/img/', './' . $webRoot . '/res/img/', 'security-logo.svg', 'security-logo.svg');
        self::_copyOrSymlink($mode, $path . '/src/Security/web/res/img/', './' . $webRoot . '/res/img/', 'security-bg.svg', 'security-bg.svg');

        print_r('Установка завершена' . "\n");

    }
}