def get_initials(full_name):
    name_parts = full_name.split()
    first_name = name_parts[0]
    # Ensure there is a last name
    last_name = name_parts[-1] if len(name_parts) > 1 else ''
    initials = (first_name[0] + last_name[0]).upper()  # DJ for "Diven Dechal Jatiputra"
    return first_name, initials