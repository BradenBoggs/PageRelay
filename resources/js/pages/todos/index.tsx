import { Head, usePage } from '@inertiajs/react';
import { TodoList } from '@/components/collaboration/todos';

export default function Todos() {
    const { url } = usePage();
    const todo = new URLSearchParams(url.split('?')[1] ?? '').get('todo');
    return (
        <>
            <Head title="Todos" />
            <TodoList key={todo ?? 'all'} initialTodo={todo} />
        </>
    );
}
