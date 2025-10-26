<?php

namespace App\Http\Controllers;

use Inertia\Inertia;

class WelcomeController extends Controller
{
    public function index()
    {
        return Inertia::render('Welcome', [
            'version' => app()->version(),
            'phpVersion' => PHP_VERSION,
        ]);
    }
}
