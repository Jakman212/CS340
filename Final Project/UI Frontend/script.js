// public/script.js
// Client-side JavaScript for Study Application

// Set today's date as default for date inputs
document.addEventListener('DOMContentLoaded', function() {
    const dateInputs = document.querySelectorAll('input[type="date"]');
    const today = new Date().toISOString().split('T')[0];

    dateInputs.forEach(input => {
        if (!input.value) {
            input.value = today;
        }
    });
});

// Form validation helper
function validateForm(formID) {
    const form = document.getElementById(formID);
    if (!form.checkValidity()) {
        form.reportValidity();
        return false;
    };

    return true;
};

// Show confirmation dialog for destructive actions
function confirmAction(message) {
    return confirm(message || 'Are you sure you want to proceed?');
}

// Display success message
function showSuccessMessage(message) {
    alert(message);
}

// Display error message
function showErrorMessage(message) {
    alert('Error: ' + message);
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}