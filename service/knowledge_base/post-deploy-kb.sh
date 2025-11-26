#!/bin/bash

set -e

# Function to get CloudFormation stack outputs
get_stack_outputs() {
    local stack_name="$1"
    local region="$2"
    
    aws cloudformation describe-stacks \
        --stack-name "$stack_name" \
        --region "$region" \
        --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
        --output text
}

# Function to enable log delivery for knowledge base
enable_log_delivery() {
    local kb_id="$1"
    local log_group_name="$2"
    local region="$3"
    
    if [[ -n "$kb_id" ]]; then
        local account=$(aws sts get-caller-identity --query Account --output text)
        
        # Check and create delivery source if it doesn't exist
        if aws logs describe-delivery-sources --region "$region" --query "deliverySources[?name=='$kb_id-source']" --output text | grep -q "$kb_id-source"; then
            echo "✅ Delivery source already exists: $kb_id-source"
        else
            aws logs put-delivery-source \
                --name "$kb_id-source" \
                --log-type "APPLICATION_LOGS" \
                --resource-arn "arn:aws:bedrock:$region:$account:knowledge-base/$kb_id" \
                --region "$region" >/dev/null 2>&1
            echo "✅ Created delivery source: $kb_id-source"
        fi
        
        # Check and create delivery destination if it doesn't exist
        if aws logs describe-delivery-destinations --region "$region" --query "deliveryDestinations[?name=='$kb_id-logs']" --output text | grep -q "$kb_id-logs"; then
            echo "✅ Delivery destination already exists: $kb_id-logs"
        else
            aws logs put-delivery-destination \
                --name "$kb_id-logs" \
                --output-format "json" \
                --delivery-destination-configuration "destinationResourceArn=arn:aws:logs:$region:$account:log-group:$log_group_name" \
                --region "$region" >/dev/null 2>&1
            echo "✅ Created delivery destination: $kb_id-logs"
        fi
        
        # Check if delivery already exists
        local existing_delivery=$(aws logs describe-deliveries \
            --region "$region" \
            --query "deliveries[?deliverySourceName=='$kb_id-source'].id" \
            --output text 2>/dev/null)
        
        if [[ -n "$existing_delivery" ]]; then
            echo "✅ Logging already enabled for KB: $kb_id"
        else
            # Create delivery to link source to destination
            if aws logs create-delivery \
                --delivery-source-name "$kb_id-source" \
                --delivery-destination-arn "arn:aws:logs:$region:$account:delivery-destination:$kb_id-logs" \
                --region "$region" >/dev/null 2>&1; then
                echo "✅ Enabled logging for KB: $kb_id"
            else
                echo "❌ Failed to enable logging for KB: $kb_id"
            fi
        fi
    fi
}

# Function to start ingestion job for knowledge base
start_ingestion_job() {
    local kb_id="$1"
    local data_source_id="$2"
    local region="$3"
    
    if [[ -n "$kb_id" && -n "$data_source_id" ]]; then
        # Check for active ingestion jobs
        local active_jobs=$(aws bedrock-agent list-ingestion-jobs \
            --knowledge-base-id "$kb_id" \
            --data-source-id "$data_source_id" \
            --region "$region" \
            --query "ingestionJobSummaries[?status=='IN_PROGRESS'].jobId" \
            --output text 2>/dev/null)
        
        if [[ -n "$active_jobs" ]]; then
            echo "⏭ Skipped (KB sync job already running): KB $kb_id"
        else
            if aws bedrock-agent start-ingestion-job \
                --knowledge-base-id "$kb_id" \
                --data-source-id "$data_source_id" \
                --region "$region" >/dev/null 2>&1; then
                echo "✅ Started ingestion job for KB: $kb_id"
            else
                echo "❌ Failed to start ingestion job for KB: $kb_id"
            fi
        fi
    fi
}

# Function to upload files to S3
upload_files_to_s3() {
    local bucket_name="$1"
    local source_dir="$2"
    local region="$3"
    
    if [[ ! -d "$source_dir" ]]; then
        echo "❌ Source directory $source_dir not found"
        return
    fi
    
    find "$source_dir" -type f \( -iname "*.pdf" -o -iname "*.doc" -o -iname "*.docx" -o -iname "*.txt" \) | while read -r file_path; do
        local filename=$(basename "$file_path")
        local key="kb-file-sources/$filename"
        
        # Check if object exists in S3
        if aws s3api head-object --bucket "$bucket_name" --key "$key" --region "$region" >/dev/null 2>&1; then
            echo "⏭ Skipped copy (file exists): s3://$bucket_name/$key"
        else
            if aws s3 cp "$file_path" "s3://$bucket_name/$key" --region "$region" >/dev/null 2>&1; then
                echo "✅ Uploaded: $file_path -> s3://$bucket_name/$key"
            else
                echo "❌ Failed to upload $file_path"
            fi
        fi
    done
}

# Main function
main() {
    # Get environment from command line argument
    local env="$1"
    if [[ -z "$env" ]]; then
        read -p "Enter environment (dev/test/staging/prod): " env
    fi
    if [[ ! "$env" =~ ^(dev|test|staging|prod)$ ]]; then
        echo "❌ Invalid environment. Must be one of: dev, test, staging, prod"
        exit 1
    fi
    
    # Get region from command line argument or use default
    local region="${2:-ap-southeast-2}"
    
    local stack_name="agentic-ai-factory-kb-$env"
    
    echo "Getting stack outputs..."
    local outputs
    if ! outputs=$(get_stack_outputs "$stack_name" "$region"); then
        echo "❌ Failed to get stack outputs for $stack_name"
        exit 1
    fi
    
    # Parse outputs
    local kb_id=$(echo "$outputs" | grep "KnowledgeBaseId" | head -1 | cut -f2)
    local integrations_kb_id=$(echo "$outputs" | grep "IntegrationsKnowledgeBaseId" | cut -f2)
    local file_sources_kb_id=$(echo "$outputs" | grep "FileSourcesKnowledgeBaseId" | cut -f2)
    local log_group_name=$(echo "$outputs" | grep "BedrockLogGroupName" | cut -f2)
    local bucket_name=$(echo "$outputs" | grep "KnowledgeBaseFilesBucketName" | cut -f2)
    local data_source_id=$(echo "$outputs" | grep "DataSourceId" | cut -f2 | cut -d'|' -f2)
    local integrations_data_source_id=$(echo "$outputs" | grep "IntegrationsDataSourceId" | cut -f2 | cut -d'|' -f2)
    local file_sources_data_source_id=$(echo "$outputs" | grep "FileSourcesDataSourceId" | cut -f2 | cut -d'|' -f2)
    
    # Enable logging for all knowledge bases
    echo -e "\nEnabling log delivery for knowledge bases to cloudwatch logs..."
    enable_log_delivery "$kb_id" "${log_group_name}${kb_id}" "$region"
    enable_log_delivery "$integrations_kb_id" "${log_group_name}${integrations_kb_id}" "$region"
    enable_log_delivery "$file_sources_kb_id" "${log_group_name}${file_sources_kb_id}" "$region"
    
    # Upload files to S3
    echo -e "\nUploading files to S3..."
    if [[ -n "$bucket_name" ]]; then
        upload_files_to_s3 "$bucket_name" "../sample-data/knowledge-data" "$region"
    fi
    
    # Start ingestion jobs for all knowledge bases
    echo -e "\nStarting ingestion jobs..."
    echo -e "\nCompliance Knowledge Base (Web Crawler):"
    start_ingestion_job "$kb_id" "$data_source_id" "$region"
    echo -e "\nIntegrations Knowledge Base (Web Crawler):"
    start_ingestion_job "$integrations_kb_id" "$integrations_data_source_id" "$region"
    echo -e "\nFile Sources Knowledge Base (S3):"
    start_ingestion_job "$file_sources_kb_id" "$file_sources_data_source_id" "$region"
    
    echo -e "\n✅ Deployment complete!"
}

# Run main function
main "$@"
