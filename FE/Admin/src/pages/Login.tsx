import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            toast.error('Vui lòng nhập email và mật khẩu');
            return;
        }

        setIsLoading(true);
        const result = await login(email, password);
        setIsLoading(false);

        if (result.success) {
            toast.success(result.message);
            navigate('/');
        } else {
            toast.error(result.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10">
            <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-2xl shadow-xl border">
                <div className="text-center space-y-2">
                    <div className="flex justify-center">
                        <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center">
                            <span className="text-2xl font-bold text-white">P</span>
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-card-foreground">PharmaCare Admin</h1>
                    <p className="text-muted-foreground">Đăng nhập để quản lý hệ thống</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email / Tài khoản</Label>
                        <Input
                            id="email"
                            type="text"
                            placeholder="Nhập email hoặc tài khoản"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Mật khẩu</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="Nhập mật khẩu"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                    </Button>
                </form>

                <div className="text-center text-sm text-muted-foreground">
                    <p>Tài khoản mẫu:</p>
                    <p><strong>Staff:</strong> staff@pharmacare.com / 123456</p>
                    <p><strong>Admin:</strong> admin@pharmacare.com / 123456</p>
                </div>
            </div>
        </div>
    );
}
