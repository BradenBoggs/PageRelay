import { Head } from '@inertiajs/react';
import { TodoList } from '@/components/collaboration/todos';

export default function Todos() {
    return (
        <>
            <Head title="Todos" />
            <TodoList />
        </>
    );
}
