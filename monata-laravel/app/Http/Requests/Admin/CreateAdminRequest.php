<?php

namespace App\Http\Requests\Admin;

use App\Base\FormRequest;

class CreateAdminRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:admins,email'],
            'phone' => ['required', 'string', 'regex:/^0[0-9]{9,}$/', 'unique:admins,phone'],
            'password' => ['required', 'string', 'min:6', 'confirmed']
        ];
    }

}
