<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Routing\Controller as BaseController;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Request;
use Inertia\Inertia;

class Controller extends BaseController
{
    use AuthorizesRequests, ValidatesRequests;
    public function create_coin(Request $request)
    {
        return Inertia::render('CreateCoin');
    }
    public function manage_liquidity(Request $request)
    {
        return Inertia::render('RaydiumLiquidityPool');
    }
    public function trending(Request $request)
    {
        return Inertia::render('TrendingCoin');
    }
    public function pumpfun(Request $request)
    {
        $response = Http::get("https://frontend-api-v3.pump.fun/coins/for-you", [
            'offset' => 0,
            'limit' => 50,
            'includeNsfw' => false
        ]);

        // Convert to collection and filter where raydium_pool is null
        $coins = collect($response->json())->filter(function ($coin) {
            return $coin['raydium_pool'] === null;
        })->values(); // Reset array keys

        return response()->json($coins->all()); // Convert back to array
    }
}
