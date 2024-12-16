import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PersonalInfoSection from "./sections/PersonalInfoSection";
import ProfessionalInfoSection from "./sections/ProfessionalInfoSection";
import { formSchema, FormValues } from "../types/form";

export default function NannyForm() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  
  const { data: nanny, isLoading } = useQuery({
    queryKey: ["nanny", id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from("nanny_profiles")
        .select(`
          *,
          profiles(
            first_name,
            last_name,
            email,
            phone
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: nanny?.profiles?.first_name || "",
      last_name: nanny?.profiles?.last_name || "",
      phone: nanny?.profiles?.phone || "",
      email: nanny?.profiles?.email || "",
      experience_years: nanny?.experience_years || 0,
      education: nanny?.education || "",
      hourly_rate: nanny?.hourly_rate || 0,
      photo_url: nanny?.photo_url || "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      console.log("Starting mutation with values:", values);
      
      // Получаем текущую сессию пользователя
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error("Session error:", sessionError);
        throw sessionError;
      }
      
      if (!session?.user?.id) {
        console.error("No user session found");
        throw new Error("Пользователь не авторизован");
      }

      console.log("User session found:", session.user.id);

      // Сначала создаем или обновляем запись в profiles
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: session.user.id,
          first_name: values.first_name,
          last_name: values.last_name,
          phone: values.phone,
          email: values.email,
        });

      if (profileError) {
        console.error("Profile update error:", profileError);
        throw profileError;
      }

      console.log("Profile updated successfully");

      // Затем создаем или обновляем профиль няни
      const { error: nannyError } = await supabase
        .from("nanny_profiles")
        .upsert({
          id: id || undefined,
          user_id: session.user.id,
          experience_years: values.experience_years,
          education: values.education,
          hourly_rate: values.hourly_rate,
          photo_url: values.photo_url,
        });

      if (nannyError) {
        console.error("Nanny profile update error:", nannyError);
        throw nannyError;
      }

      console.log("Nanny profile updated successfully");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nannies"] });
      toast({
        title: "Успешно",
        description: "Данные сохранены",
      });
      navigate("/nannies");
    },
    onError: (error) => {
      console.error("Error saving nanny:", error);
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось сохранить данные",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    mutation.mutate(data);
  };

  if (isLoading) {
    return <div>Загрузка...</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">
        {id ? "Редактирование анкеты няни" : "Создание анкеты няни"}
      </h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="space-y-8">
            <PersonalInfoSection form={form} />
            <ProfessionalInfoSection form={form} />
          </div>

          <div className="flex justify-end gap-4">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => navigate("/nannies")}
            >
              Отмена
            </Button>
            <Button type="submit">Сохранить</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}