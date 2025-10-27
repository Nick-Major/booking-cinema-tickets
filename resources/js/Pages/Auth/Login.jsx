import { Head, useForm } from '@inertiajs/react';
import { useEffect } from 'react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    useEffect(() => {
        return () => {
            reset('password');
        };
    }, []);

    const submit = (e) => {
        e.preventDefault();
        post(route('login'));
    };

    return (
        <>
            <Head title="Авторизация" />
            
            <header className="page-header">
                <h1 className="page-header__title">Идём<span>в</span>кино</h1>
                <span className="page-header__subtitle">Администраторррская</span>
            </header>
            
            <main>
                <section className="login">
                    <header className="login__header">
                        <h2 className="login__title">Авторизация</h2>
                    </header>
                    <div className="login__wrapper">
                        <form className="login__form" onSubmit={submit}>
                            <label className="login__label" htmlFor="email">
                                E-mail
                                <input 
                                    className="login__input" 
                                    type="email" 
                                    placeholder="example@domain.xyz" 
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    required 
                                />
                                {errors.email && <div className="error">{errors.email}</div>}
                            </label>
                            <label className="login__label" htmlFor="password">
                                Пароль
                                <input 
                                    className="login__input" 
                                    type="password" 
                                    placeholder="" 
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    required 
                                />
                                {errors.password && <div className="error">{errors.password}</div>}
                            </label>
                            <div className="text-center">
                                <button 
                                    type="submit" 
                                    className="login__button" 
                                    disabled={processing}
                                >
                                    Авторизоваться
                                </button>
                            </div>
                        </form>
                    </div>
                </section>
            </main>
        </>
    );
}
