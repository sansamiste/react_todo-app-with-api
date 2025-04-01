import { useEffect, useRef, useState } from 'react';
import { Todo } from '../types/Todo';
import cn from 'classnames';

interface Props {
  todo: Todo;
  toggleTodo: (id: number) => void;
  deleteTodo: (id: number) => void;
  renameTodo: (
    id: number,
    newTitle: string,
    inputRef: React.RefObject<HTMLInputElement>,
  ) => void;
  isLoading: boolean | undefined;
  isToggling: boolean;
}

export const TodoItem = ({
  todo,
  toggleTodo,
  deleteTodo,
  renameTodo,
  isLoading,
}: Props) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(todo.title);
  const [isError, setIsError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isEditing, todo]);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = async () => {
    const trimmedTitle = newTitle.trim();

    if (trimmedTitle === todo.title || isError) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setIsEditing(false);

      return;
    }

    try {
      await renameTodo(todo.id, trimmedTitle, inputRef);
      setIsEditing(false);
      setIsError(false);
    } catch {
      setIsError(true);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const handleKeyUp = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setNewTitle(todo.title);
      setIsEditing(false);
    }

    if (event.key === 'Enter' && !isError) {
      (event.currentTarget as HTMLInputElement).blur();
      setIsEditing(false);
    }
  };

  return (
    <div
      data-cy="Todo"
      className={cn('todo', {
        completed: todo.completed,
        'is-editing': isEditing,
      })}
    >
      <label className="todo__status-label">
        <input
          data-cy="TodoStatus"
          type="checkbox"
          className="todo__status"
          checked={todo.completed}
          onChange={() => toggleTodo(todo.id)}
        />
        <span className="visually-hidden">Mark as done</span>
      </label>

      {isEditing ? (
        <input
          type="text"
          className="todo__title-field"
          value={newTitle}
          data-cy="TodoTitleField"
          onBlur={handleBlur}
          onChange={e => setNewTitle(e.target.value)}
          onKeyUp={handleKeyUp}
          autoFocus
          ref={inputRef}
        />
      ) : (
        <span
          data-cy="TodoTitle"
          className="todo__title"
          onDoubleClick={handleDoubleClick}
        >
          {todo.title}
        </span>
      )}

      {isError && (
        <div className="error-message">
          <span>Unable to update the task. Please try again.</span>
        </div>
      )}

      {!isEditing && (
        <button
          type="button"
          className="todo__remove"
          data-cy="TodoDelete"
          onClick={() => deleteTodo(todo.id)}
          disabled={isLoading}
        >
          ×
        </button>
      )}

      <div
        data-cy="TodoLoader"
        className={cn('modal overlay', { 'is-active': isLoading })}
      >
        <div className="modal-background has-background-white-ter" />
        <div className="loader" />
      </div>
    </div>
  );
};
