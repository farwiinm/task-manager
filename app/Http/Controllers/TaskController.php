<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Task;

class TaskController extends Controller
{
    public function index(Request $request)
    {
        $query = Task::where('user_id', $request->user()->id);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('due_date')) {
            $query->whereDate('due_date', $request->due_date);
        }

        if ($request->has('search')) {
            $query->where('title', 'like', '%' . $request->search . '%');
        }

        $tasks = $query->paginate(10);

        return response()->json($tasks);
    }

        public function store(Request $request)
    {
        $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'status'      => 'nullable|in:pending,in-progress,completed',
            'due_date'    => 'nullable|date',
        ]);

        $task = Task::create([
            'user_id'     => $request->user()->id,
            'title'       => $request->title,
            'description' => $request->description,
            'status'      => $request->status ?? 'pending',
            'due_date'    => $request->due_date,
        ]);

        return response()->json([
            'message' => 'Task created successfully',
            'task'    => $task,
        ], 201);
    }

        public function show(Request $request, $id)
    {
        $task = Task::where('id', $id)
                    ->where('user_id', $request->user()->id)
                    ->first();

        if (!$task) {
            return response()->json(['message' => 'Task not found'], 404);
        }

        return response()->json($task);
    }

    public function update(Request $request, $id)
    {
        $task = Task::where('id', $id)
                    ->where('user_id', $request->user()->id)
                    ->first();

        if (!$task) {
            return response()->json(['message' => 'Task not found'], 404);
        }

        $request->validate([
            'title'       => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'status'      => 'nullable|in:pending,in-progress,completed',
            'due_date'    => 'nullable|date',
        ]);

        $task->update($request->only(['title', 'description', 'status', 'due_date']));

        return response()->json([
            'message' => 'Task updated successfully',
            'task'    => $task,
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $task = Task::where('id', $id)
                    ->where('user_id', $request->user()->id)
                    ->first();

        if (!$task) {
            return response()->json(['message' => 'Task not found'], 404);
        }

        $task->delete(); 

        return response()->json(['message' => 'Task deleted successfully']);
    }

    public function trashed(Request $request)
    {
        $tasks = Task::onlyTrashed()
                     ->where('user_id', $request->user()->id)
                     ->paginate(10);

        return response()->json($tasks);
    }

    public function restore(Request $request, $id)
    {
        $task = Task::onlyTrashed()
                    ->where('id', $id)
                    ->where('user_id', $request->user()->id)
                    ->first();

        if (!$task) {
            return response()->json(['message' => 'Task not found in trash'], 404);
        }

        $task->restore(); 

        return response()->json([
            'message' => 'Task restored successfully',
            'task'    => $task,
        ]);
    }
}
