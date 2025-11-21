<?php

namespace Database\Seeders;

use App\Models\CinemaHall;
use App\Models\Movie;
use App\Models\MovieSession;
use App\Models\Seat;
use App\Models\Ticket;
use App\Models\User;
use App\Models\HallSchedule;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class TestDataSeeder extends Seeder
{
    public function run(): void
    {
        // Создаем залы
        $hall1 = CinemaHall::firstOrCreate(
            ['hall_name' => 'Основной зал'],
            [
                'row_count' => 8,
                'max_seats_number_in_row' => 10,
                'is_active' => true,
                'regular_price' => 400.00,
                'vip_price' => 600.00,
            ]
        );

        $hall2 = CinemaHall::firstOrCreate(
            ['hall_name' => 'VIP зал'],
            [
                'row_count' => 6,
                'max_seats_number_in_row' => 8,
                'is_active' => true,
                'regular_price' => 500.00,
                'vip_price' => 800.00,
            ]
        );

        // Создаем места для залов
        $this->createSeatsForHall($hall1);
        $this->createSeatsForHall($hall2);

        // Создаем фильмы с путями через Storage
        $movies = [
            [
                'title' => 'Аватар: Путь воды',
                'movie_description' => 'Фантастический боевик о приключениях на Пандоре',
                'movie_duration' => 192,
                'country' => 'США',
                'is_active' => true,
                'movie_poster' => 'posters/avatar.jpg',
            ],
            [
                'title' => 'Оппенгеймер',
                'movie_description' => 'Биографический фильм о создателе атомной бомбы',
                'movie_duration' => 180,
                'country' => 'США',
                'is_active' => true,
                'movie_poster' => 'posters/oppenheimer.jpg',
            ],
            [
                'title' => 'Довод',
                'movie_description' => 'Научно-фантастический боевик о путешествиях во времени',
                'movie_duration' => 150,
                'country' => 'Великобритания',
                'is_active' => true,
                'movie_poster' => 'posters/tenet.jpg',
            ]
        ];

        foreach ($movies as $movieData) {
            Movie::firstOrCreate(
                ['title' => $movieData['title']],
                $movieData
            );
        }

        // Создаем расписания для залов
        $today = Carbon::today();
        $tomorrow = Carbon::tomorrow();

        // Расписание для Основного зала на сегодня
        HallSchedule::firstOrCreate(
            [
                'cinema_hall_id' => $hall1->id,
                'date' => $today->format('Y-m-d'),
            ],
            [
                'start_time' => '09:00',
                'end_time' => '23:00',
                'overnight' => false,
            ]
        );

        // Расписание для VIP зала на сегодня
        HallSchedule::firstOrCreate(
            [
                'cinema_hall_id' => $hall2->id,
                'date' => $today->format('Y-m-d'),
            ],
            [
                'start_time' => '10:00',
                'end_time' => '24:00',
                'overnight' => true,
            ]
        );

        // Расписание для завтра
        HallSchedule::firstOrCreate(
            [
                'cinema_hall_id' => $hall1->id,
                'date' => $tomorrow->format('Y-m-d'),
            ],
            [
                'start_time' => '10:00',
                'end_time' => '22:00',
                'overnight' => false,
            ]
        );

        // СОЗДАЕМ СЕАНСЫ НА БУДУЩЕЕ ВРЕМЯ
        $movie1 = Movie::where('title', 'Аватар: Путь воды')->first();
        $movie2 = Movie::where('title', 'Оппенгеймер')->first();
        $movie3 = Movie::where('title', 'Довод')->first();

        // Получаем текущее время и добавляем часы для будущих сеансов
        $now = Carbon::now();
        
        // Сеансы на сегодня - ставим на время после текущего
        $todaySession1 = $today->copy()->setTime($now->hour + 2, 0); // Через 2 часа
        $todaySession2 = $today->copy()->setTime($now->hour + 5, 0); // Через 5 часов  
        $todaySession3 = $today->copy()->setTime($now->hour + 3, 0); // Через 3 часа

        // Убедимся, что время не выходит за пределы расписания
        if ($todaySession1->hour >= 23) $todaySession1 = $today->copy()->setTime(20, 0);
        if ($todaySession2->hour >= 23) $todaySession2 = $today->copy()->setTime(21, 0);
        if ($todaySession3->hour >= 24) $todaySession3 = $today->copy()->setTime(19, 0);

        // Утренний сеанс на сегодня (будущее время)
        MovieSession::firstOrCreate(
            [
                'cinema_hall_id' => $hall1->id,
                'movie_id' => $movie1->id,
                'session_start' => $todaySession1,
            ],
            [
                'session_end' => $todaySession1->copy()->addMinutes($movie1->movie_duration),
                'is_actual' => true,
            ]
        );

        // Дневной сеанс на сегодня (будущее время)
        MovieSession::firstOrCreate(
            [
                'cinema_hall_id' => $hall1->id,
                'movie_id' => $movie2->id,
                'session_start' => $todaySession2,
            ],
            [
                'session_end' => $todaySession2->copy()->addMinutes($movie2->movie_duration),
                'is_actual' => true,
            ]
        );

        // Вечерний сеанс на сегодня (будущее время)
        MovieSession::firstOrCreate(
            [
                'cinema_hall_id' => $hall2->id,
                'movie_id' => $movie3->id,
                'session_start' => $todaySession3,
            ],
            [
                'session_end' => $todaySession3->copy()->addMinutes($movie3->movie_duration),
                'is_actual' => true,
            ]
        );

        // Сеанс на завтра
        MovieSession::firstOrCreate(
            [
                'cinema_hall_id' => $hall1->id,
                'movie_id' => $movie1->id,
                'session_start' => $tomorrow->copy()->setTime(16, 0),
            ],
            [
                'session_end' => $tomorrow->copy()->setTime(19, 12),
                'is_actual' => true,
            ]
        );

        // Создаем тестового пользователя
        $testUser = User::firstOrCreate(
            ['email' => 'test@user.ru'],
            [
                'name' => 'Тестовый Пользователь',
                'password' => bcrypt('password123'),
                'is_admin' => false,
            ]
        );

        // Создаем тестовый билет (на первый доступный сеанс)
        $session = MovieSession::where('session_start', '>', now())->first();
        if ($session) {
            $seat = Seat::where('cinema_hall_id', $session->cinema_hall_id)
                       ->where('seat_status', 'regular')
                       ->first();

            if ($seat) {
                Ticket::firstOrCreate(
                    [
                        'movie_session_id' => $session->id,
                        'seat_id' => $seat->id,
                    ],
                    [
                        'user_id' => $testUser->id,
                        'status' => 'reserved',
                        'final_price' => $seat->getPriceAttribute(),
                        'unique_code' => Ticket::generateUniqueCode(),
                        'expires_at' => null,
                    ]
                );
            }
        }

        $this->command->info('Тестовые данные созданы успешно!');
        $this->command->info('Залы: ' . CinemaHall::count());
        $this->command->info('Места: ' . Seat::count());
        $this->command->info('Фильмы: ' . Movie::count());
        $this->command->info('Расписания: ' . HallSchedule::count());
        $this->command->info('Сеансы: ' . MovieSession::count());
        $this->command->info('Билеты: ' . Ticket::count());
    }

    private function createSeatsForHall(CinemaHall $hall): void
    {
        for ($row = 1; $row <= $hall->row_count; $row++) {
            for ($seatNumber = 1; $seatNumber <= $hall->max_seats_number_in_row; $seatNumber++) {
                $status = $row <= 2 ? 'vip' : 'regular';
                
                if (rand(1, 20) === 1) {
                    $status = 'blocked';
                }

                Seat::firstOrCreate(
                    [
                        'cinema_hall_id' => $hall->id,
                        'row_number' => $row,
                        'row_seat_number' => $seatNumber,
                    ],
                    [
                        'seat_status' => $status,
                    ]
                );
            }
        }
    }
}
