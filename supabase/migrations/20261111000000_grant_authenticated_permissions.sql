grant usage on schema public to authenticated;
grant usage on schema extensions to authenticated;

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.quizzes to authenticated;
grant select, insert on public.quiz_attempts to authenticated;
grant select on public.ai_quiz_usage to authenticated;

grant select, insert, update, delete on public.study_documents to authenticated;
grant select, insert, delete on public.document_chunks to authenticated;
grant select on public.ai_tutor_usage to authenticated;
grant select on public.ai_document_usage to authenticated;

grant execute on function public.consume_quiz_generation() to authenticated;
grant execute on function public.consume_tutor_request() to authenticated;
grant execute on function public.consume_document_index() to authenticated;
grant execute on function public.match_document_chunks(extensions.vector, integer, uuid) to authenticated;
