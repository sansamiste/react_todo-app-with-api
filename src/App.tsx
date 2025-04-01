/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useState, useCallback } from 'react';
import { UserWarning } from './UserWarning';
import {
  USER_ID,
  getTodos,
  addTodo,
  deleteTodo,
  updateTodo,
} from './api/todos';
import { Todo } from './types/Todo';
import { TodoList } from './components/TodoList';
import { FilterStatus } from './types/FilterStatus';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import ErrorNotification from './components/ErrorNotification';

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>(
    FilterStatus.All,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [tempAddedTodo, setTempAddedTodo] = useState<Todo | null>(null);
  const [deletedIds, setDeletedIds] = useState<number[]>([]);
  const [toggledIds] = useState<number[]>([]);

  const handleError = (message: string) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(''), 3000);
  };

  useEffect(() => {
    setIsLoading(true);
    getTodos()
      .then(setTodos)
      .catch(() => {
        setErrorMessage('Unable to load todos');
        setTimeout(() => setErrorMessage(''), 3000);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const filteredTodos = todos.filter(todo => {
    switch (filterStatus) {
      case FilterStatus.Active:
        return !todo.completed;
      case FilterStatus.Completed:
        return todo.completed;
      default:
        return true;
    }
  });

  const handleAddTodo = () => {
    const title = newTodoTitle.trim();

    if (!title) {
      handleError('Title should not be empty');

      return;
    }

    setIsLoading(true);

    const newTodo: Todo = {
      id: 0,
      userId: USER_ID,
      title,
      completed: false,
    };

    setTempAddedTodo(newTodo);

    return addTodo(title)
      .then(todo => {
        setTodos(currentTodos => [...currentTodos, todo]);
        setNewTodoTitle('');
      })
      .catch(() => {
        handleError('Unable to add a todo');
      })
      .finally(() => {
        setIsLoading(false);
        setTempAddedTodo(null);
      });
  };

  const handleFilterChange = useCallback((status: FilterStatus) => {
    setFilterStatus(status);
  }, []);

  const toggleTodo = async (id: number) => {
    setDeletedIds(ids => [...ids, id]);

    await new Promise(resolve => setTimeout(resolve, 50));

    try {
      const todoToUpdate = todos.find(todo => todo.id === id);

      if (todoToUpdate) {
        const updatedTodoFS = await updateTodo(id, {
          completed: !todoToUpdate.completed,
        });

        setTodos(prevTodos =>
          prevTodos.map(todo =>
            todo.id === id
              ? { ...todo, completed: updatedTodoFS.completed }
              : todo,
          ),
        );
      }
    } catch (error) {
      setErrorMessage('Unable to update a todo');
    } finally {
      setDeletedIds(ids => ids.filter(todoId => todoId !== id));
    }
  };

  const toggleAllTodos = useCallback(async () => {
    const areAllCompleted = todos.every(todo => todo.completed);
    const todosToUpdate = todos.filter(
      todo => todo.completed === areAllCompleted,
    );

    if (todosToUpdate.length === 0) {
      return;
    }

    try {
      setTodos(prevTodos =>
        prevTodos.map(todo =>
          todosToUpdate.some(t => t.id === todo.id)
            ? { ...todo, completed: !areAllCompleted }
            : todo,
        ),
      );

      await Promise.all(
        todosToUpdate.map(todo =>
          updateTodo(todo.id, { completed: !areAllCompleted }),
        ),
      );
    } catch (error) {
      setErrorMessage('Unable to update todos');
    }
  }, [todos]);

  const handleDeleteTodo = async (todoId: number) => {
    setDeletedIds(ids => [...ids, todoId]);

    try {
      await deleteTodo(todoId);
      setTodos(prevTodos => prevTodos.filter(todo => todo.id !== todoId));
    } catch {
      handleError('Unable to delete a todo');
    } finally {
      setDeletedIds(ids => ids.filter(id => id !== todoId));
    }
  };

  const handleRenameTodo = async (id: number, newTitle: string) => {
    if (isLoading) {
      return;
    }

    const foundTodo = todos.find(todo => todo.id === id);

    if (!foundTodo) {
      return;
    }

    const trimmedTitle = newTitle.trim();

    if (!trimmedTitle) {
      return handleDeleteTodo(id);
    }

    if (trimmedTitle === foundTodo.title) {
      return;
    }

    setDeletedIds(prev => [...prev, id]);

    setTodos(prevTodos =>
      prevTodos.map(todo =>
        todo.id === id ? { ...todo, title: trimmedTitle } : todo,
      ),
    );

    try {
      await updateTodo(id, { title: trimmedTitle });
    } catch {
      handleError('Unable to update a todo');
      setTodos(prevTodos =>
        prevTodos.map(todo => (todo.id === id ? foundTodo : todo)),
      );
    } finally {
      setDeletedIds(prev => prev.filter(loadingId => loadingId !== id));
    }
  };

  if (!USER_ID) {
    return <UserWarning />;
  }

  return (
    <div className="todoapp" data-cy="TodoApp">
      <h1 className="todoapp__title" data-cy="TodoAppTitle">
        todos
      </h1>
      <div className="todoapp__content">
        <Header
          newTodoTitle={newTodoTitle}
          setNewTodoTitle={setNewTodoTitle}
          handleAddTodo={handleAddTodo}
          toggleAllTodos={toggleAllTodos}
          isLoading={isLoading}
          todos={todos}
          data-cy="Header"
        />

        <section className="todoapp__main" data-cy="TodoList">
          <TodoList
            visibleTodos={filteredTodos}
            toggleTodo={toggleTodo}
            deleteTodo={handleDeleteTodo}
            renameTodo={handleRenameTodo}
            isLoading={isLoading}
            tempAddedTodo={tempAddedTodo}
            deletedIds={deletedIds}
            toggledIds={toggledIds}
            data-cy="TodoListComponent"
          />
        </section>
        {todos.length > 0 && (
          <Footer
            todos={todos}
            filterStatus={filterStatus}
            handleFilterChange={handleFilterChange}
            handleDeleteTodo={handleDeleteTodo}
            data-cy="Footer"
          />
        )}
      </div>
      <ErrorNotification
        errorMessage={errorMessage}
        data-cy="ErrorNotification"
        aria-live="assertive"
      />
    </div>
  );
};
