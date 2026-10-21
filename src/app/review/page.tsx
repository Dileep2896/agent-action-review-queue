import { repository } from '@/lib/repo/in-memory';
import { ReviewApp } from '@/components/review/review-app';
export default async function ReviewPage() {
  return <ReviewApp initialActions={await repository.list()} />;
}
