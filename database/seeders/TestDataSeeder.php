<?php

namespace Database\Seeders;

use App\Models\CinemaHall;
use App\Models\Movie;
use App\Models\MovieSession;
use App\Models\Seat;
use App\Models\Ticket;
use App\Models\User;
use App\Models\HallSchedule;
use App\Models\Booking;
use App\Services\SessionValidationService;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class TestDataSeeder extends Seeder
{
    private $validationService;
    
    public function __construct(SessionValidationService $validationService)
    {
        $this->validationService = $validationService;
    }
    
    public function run(): void
    {
        $this->command->info('Начинаем создание тестовых данных...');
        
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

        // Создаем фильмы
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
            Movie::updateOrCreate(
                ['title' => $movieData['title']],
                $movieData
            );
        }

        // Создаем расписания для залов на сегодня и завтра
        $today = Carbon::today();
        $tomorrow = Carbon::tomorrow();

        $this->command->info("Создаем расписания на {$today->format('d.m.Y')} и {$tomorrow->format('d.m.Y')}");

        // Расписание для Основного зала на сегодня
        $hall1ScheduleToday = HallSchedule::firstOrCreate(
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
        $hall2ScheduleToday = HallSchedule::firstOrCreate(
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
        $hall1ScheduleTomorrow = HallSchedule::firstOrCreate(
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

        // Создаем сеансы с помощью сервиса валидации
        $movie1 = Movie::where('title', 'Аватар: Путь воды')->first();
        $movie2 = Movie::where('title', 'Оппенгеймер')->first();
        $movie3 = Movie::where('title', 'Довод')->first();

        $this->command->info('Создаем сеансы...');

        // Попробуем создать сеансы в разное "круглое" время
        $todayTimes = [
            ['time' => '10:00', 'hall' => $hall1, 'movie' => $movie1],
            ['time' => '14:00', 'hall' => $hall1, 'movie' => $movie2],
            ['time' => '12:00', 'hall' => $hall2, 'movie' => $movie3],
            ['time' => '18:00', 'hall' => $hall1, 'movie' => $movie3],
        ];
        
        $tomorrowTimes = [
            ['time' => '16:00', 'hall' => $hall1, 'movie' => $movie1],
            ['time' => '19:00', 'hall' => $hall2, 'movie' => $movie2],
        ];

        foreach ($todayTimes as $session) {
            $this->createValidatedSession(
                $session['hall'], 
                $session['movie'], 
                $today, 
                $session['time']
            );
        }
        
        foreach ($tomorrowTimes as $session) {
            $this->createValidatedSession(
                $session['hall'], 
                $session['movie'], 
                $tomorrow, 
                $session['time']
            );
        }

        // Создаем тестового пользователя
        $testUser = User::firstOrCreate(
            ['email' => 'test@user.ru'],
            [
                'name' => 'Тестовый Пользователь',
                'password' => bcrypt('password123'),
                'is_admin' => false,
            ]
        );

        // Создаем тестовое бронирование с билетом
        $session = MovieSession::where('session_start', '>', now())
            ->orderBy('session_start')
            ->first();
            
        if ($session) {
            $seat = Seat::where('cinema_hall_id', $session->cinema_hall_id)
                       ->where('seat_status', 'regular')
                       ->first();

            if ($seat) {
                // Создаем бронирование
                $booking = Booking::firstOrCreate(
                    [
                        'booking_code' => Booking::generateBookingCode(),
                    ],
                    [
                        'user_id' => $testUser->id,
                        'guest_email' => null,
                        'guest_phone' => null,
                        'guest_name' => null,
                        'movie_session_id' => $session->id,
                        'total_price' => $seat->getPriceAttribute(),
                        'status' => 'reserved',
                        'expires_at' => now()->addHours(24),
                    ]
                );

                // Создаем билет
                Ticket::firstOrCreate(
                    [
                        'booking_id' => $booking->id,
                        'seat_id' => $seat->id,
                    ],
                    [
                        'movie_session_id' => $session->id,
                        'status' => 'reserved',
                        'final_price' => $seat->getPriceAttribute(),
                        'unique_code' => Ticket::generateUniqueCode(),
                        'expires_at' => now()->addHours(24),
                    ]
                );
                $this->command->info("Создано тестовое бронирование для пользователя {$testUser->name}");
            }
        }

        $this->command->info('=== Сводка тестовых данных ===');
        $this->command->info('Залы: ' . CinemaHall::count());
        $this->command->info('Места: ' . Seat::count());
        $this->command->info('Фильмы: ' . Movie::count());
        $this->command->info('Расписания: ' . HallSchedule::count());
        $this->command->info('Сеансы: ' . MovieSession::count());
        $this->command->info('Бронирования: ' . Booking::count());
        $this->command->info('Билеты: ' . Ticket::count());
    }

    /**
     * Создать сеанс с проверкой валидации
     */
    private function createValidatedSession($hall, $movie, $date, $time): void
    {
        try {
            $sessionStart = Carbon::createFromFormat('Y-m-d H:i', $date->format('Y-m-d') . ' ' . $time);
            
            // Используем сервис валидации
            $validationResult = $this->validationService->validateSession(
                $hall->id,
                $movie->id,
                $sessionStart
            );
            
            if (!$validationResult['valid']) {
                $this->command->warn("Не удалось создать сеанс '{$movie->title}' в {$time}: {$validationResult['message']}");
                
                // Попробуем найти ближайшее доступное время
                $availableTime = $this->validationService->findAvailableTime(
                    $hall->id,
                    $movie->id,
                    $sessionStart
                );
                
                if ($availableTime['success']) {
                    $newTime = $availableTime['available_time']->format('H:i');
                    $this->command->info("Вместо этого создаем сеанс в {$newTime}");
                    
                    // Создаем сеанс в доступное время
                    MovieSession::firstOrCreate(
                        [
                            'cinema_hall_id' => $hall->id,
                            'movie_id' => $movie->id,
                            'session_start' => $availableTime['available_time'],
                        ],
                        [
                            'session_end' => $availableTime['session_end'],
                            'is_actual' => true,
                        ]
                    );
                    
                    $this->command->info("Создан сеанс '{$movie->title}' в зале '{$hall->hall_name}' на {$newTime}");
                }
                return;
            }
            
            // Создаем сеанс
            MovieSession::firstOrCreate(
                [
                    'cinema_hall_id' => $hall->id,
                    'movie_id' => $movie->id,
                    'session_start' => $sessionStart,
                ],
                [
                    'session_end' => $validationResult['session_end'],
                    'is_actual' => true,
                ]
            );
            
            $this->command->info("Создан сеанс '{$movie->title}' в зале '{$hall->hall_name}' на {$sessionStart->format('H:i')}");
            
        } catch (\Exception $e) {
            $this->command->error("Ошибка при создании сеанса '{$movie->title}': " . $e->getMessage());
        }
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
