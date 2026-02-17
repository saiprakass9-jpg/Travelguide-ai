import os
import streamlit as st
import google.generativeai as genai

# Configure the API key from environment variables
api_key = os.environ.get("API_KEY")

def configure_genai():
    if not api_key:
        st.error("API_KEY environment variable not found. Please set it to use the app.")
        return False
    genai.configure(api_key=api_key)
    return True

def generate_itinerary(destination, days, nights):
    """
    Generates a travel itinerary using the Gemini model.
    """
    try:
        # Initialize the model
        model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            system_instruction="You are an expert travel planner. Create detailed, day-by-day itineraries. Format the response in Markdown."
        )

        # Create the prompt
        prompt = f"Create a detailed travel itinerary for {days} days and {nights} nights in {destination}. Include must-visit landmarks and local food recommendations."

        # Generate content
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"An error occurred while generating the itinerary: {str(e)}"

def main():
    st.set_page_config(page_title="Travel Itinerary Generator", page_icon="✈️")
    
    st.title("Travel Itinerary Generator")
    st.markdown("Explore with AI: Custom Itineraries for Your Next Journey")

    # Check for API Key
    if configure_genai():
        # User Inputs
        destination = st.text_input("Enter your desired destination:", placeholder="e.g., Kyoto, Japan")
        
        col1, col2 = st.columns(2)
        with col1:
            days = st.number_input("Enter the number of days:", min_value=1, value=3)
        with col2:
            nights = st.number_input("Enter the number of nights:", min_value=0, value=2)

        # Generate Button
        if st.button("Generate Itinerary", type="primary"):
            if destination.strip() and days > 0:
                with st.spinner("Crafting your perfect journey..."):
                    itinerary = generate_itinerary(destination, days, nights)
                    
                    st.divider()
                    st.subheader(f"Trip to {destination}")
                    st.markdown(itinerary)
            else:
                st.warning("Please make sure all inputs are provided and valid.")

if __name__ == "__main__":
    main()