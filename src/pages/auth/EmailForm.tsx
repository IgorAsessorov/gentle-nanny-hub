import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface EmailFormProps {
  onEmailSubmit: (email: string) => void;
}

const EmailForm = ({ onEmailSubmit }: EmailFormProps) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    console.log("Начинаем процесс отправки кода для:", email);
    
    try {
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 30 * 60000); // 30 минут

      // Удаляем старые коды для этого email
      const { error: deleteError } = await supabase
        .from('verification_codes')
        .delete()
        .eq('email', email);

      if (deleteError) {
        console.error("Ошибка при удалении старых кодов:", deleteError);
        throw deleteError;
      }

      // Сохраняем новый код в базе данных
      const { error: insertError } = await supabase
        .from('verification_codes')
        .insert({
          email,
          code: verificationCode,
          expires_at: expiresAt.toISOString(),
        });

      console.log("Результат сохранения кода:", { insertError });
      if (insertError) throw insertError;

      // Отправляем email через Edge Function
      const { error } = await supabase.functions.invoke('send-verification-email', {
        body: { to: email, code: verificationCode }
      });

      console.log("Результат отправки email:", { error });
      if (error) throw error;

      toast({
        title: "Код подтверждения отправлен",
        description: "Пожалуйста, проверьте вашу почту",
      });
      
      onEmailSubmit(email);
    } catch (error: any) {
      console.error('Ошибка отправки кода:', error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось отправить код подтверждения",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-sm">
      <div className="space-y-2">
        <Input
          type="email"
          placeholder="Введите email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full"
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Отправка..." : "Отправить код"}
      </Button>
    </form>
  );
};

export default EmailForm;