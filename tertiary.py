def get_initials(full_name):
    name_parts = full_name.split()
    first_name = name_parts[0]
    
    # If there's no last name, use an empty string for the initial
    last_initial = name_parts[1][0] if len(name_parts) > 1 else ''
    
    initials = (first_name[0] + last_initial).upper()  # DJ for "Diven Dechal Jatiputra"
    return first_name, initials