<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Seat;
use Illuminate\Support\Facades\DB;

class CleanDuplicateSeats extends Command
{
    protected $signature = 'seats:clean-duplicates {hallId?}';
    protected $description = 'Clean duplicate seats for a hall';

    public function handle()
    {
        $hallId = $this->argument('hallId');
        
        if ($hallId) {
            $this->cleanHall($hallId);
        } else {
            // Очистить все залы
            $halls = DB::table('seats')
                ->select('cinema_hall_id')
                ->groupBy('cinema_hall_id')
                ->get();
            
            foreach ($halls as $hall) {
                $this->cleanHall($hall->cinema_hall_id);
            }
        }
        
        $this->info('Duplicate seats cleaned successfully!');
    }
    
    private function cleanHall($hallId)
    {
        $this->info("Cleaning duplicates for hall {$hallId}");
        
        // Находим дубликаты
        $duplicates = DB::table('seats')
            ->select('row_number', 'row_seat_number', DB::raw('COUNT(*) as count'))
            ->where('cinema_hall_id', $hallId)
            ->groupBy('row_number', 'row_seat_number')
            ->having('count', '>', 1)
            ->get();
            
        if ($duplicates->isEmpty()) {
            $this->info("No duplicates found for hall {$hallId}");
            return;
        }
        
        $this->info("Found {$duplicates->count()} duplicate groups for hall {$hallId}");
        
        foreach ($duplicates as $duplicate) {
            // Оставляем первую запись, удаляем остальные
            $keepers = DB::table('seats')
                ->where('cinema_hall_id', $hallId)
                ->where('row_number', $duplicate->row_number)
                ->where('row_seat_number', $duplicate->row_seat_number)
                ->orderBy('id')
                ->limit(1)
                ->pluck('id');
                
            DB::table('seats')
                ->where('cinema_hall_id', $hallId)
                ->where('row_number', $duplicate->row_number)
                ->where('row_seat_number', $duplicate->row_seat_number)
                ->whereNotIn('id', $keepers)
                ->delete();
                
            $this->info("Cleaned duplicates for row {$duplicate->row_number}, seat {$duplicate->row_seat_number}");
        }
    }
}
