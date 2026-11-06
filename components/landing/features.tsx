import {
  Bell,
  FileCheck2,
  LayoutDashboard,
  MapPin,
  MonitorSmartphone,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type Feature = {
  icon: LucideIcon;
  title: string;
  text: string;
};

const features: Feature[] = [
  {
    icon: LayoutDashboard,
    title: "Канбан без сюрпризов",
    text: "Шесть статусов, drag-and-drop, оптимистичные обновления и откат при ошибке.",
  },
  {
    icon: MapPin,
    title: "Пины на макетах",
    text: "Клик по изображению — и комментарий привязан к точке. Не съезжает при ресайзе и на мобильном.",
  },
  {
    icon: Users,
    title: "Портал клиента",
    text: "Одна ссылка — доступ к своим проектам. Без регистрации, паролей и лишних аккаунтов.",
  },
  {
    icon: FileCheck2,
    title: "Файлы с проверкой",
    text: "JPEG, PNG, WebP, PDF, ZIP, DOCX. Лимиты, magic bytes и приватный Storage с signed URL.",
  },
  {
    icon: Bell,
    title: "Понятные уведомления",
    text: "Новый комментарий, смена статуса, файл, дедлайн за 24 часа — всё в колокольчике.",
  },
  {
    icon: MonitorSmartphone,
    title: "Демо без входа",
    text: "Публичная доска с вымышленными данными: можно показать клиенту до старта.",
  },
];

export function Features() {
  return (
    <section id="features" className="border-y border-border/60 bg-card/30">
      <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-20">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            Возможности
          </p>
          <h2 className="mt-3 font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
            Всё, что нужно для спокойной работы
          </h2>
          <p className="mt-4 text-muted-foreground">
            Админ ведёт проект, клиент согласует — в одном месте, без
            дублирования в чатах.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                className="border-border/70 bg-card/70 backdrop-blur-sm transition-colors hover:border-primary/40"
              >
                <CardHeader>
                  <div className="mb-2 grid size-10 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="font-heading text-lg font-bold">
                    {feature.title}
                  </h3>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {feature.text}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
